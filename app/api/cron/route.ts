import Product from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongoose"
import { scrapeAmazonProduct } from "@/lib/scraper";
import { getAveragePrice, getEmailNotifType, getHighestPrice, getLowestPrice } from './../../../lib/utils';
import { generateEmailBody, sendEmail } from "@/lib/nodemailer";
import { NextResponse } from "next/server";

export const maxDuration = 9;
export const dynamic = 'force-dynamic'
export const revalidate = 0;

export async function GET() {
    try {
        connectToDB();

        const product = await Product.find({})

        if(!product) throw new Error("No product found")

        // 1. SCRAPE LATEST PRODUCT DETAILS AND UPDATED DB
        const updatedProducts = await Promise.all(
            product.map(async (currentProduct) => {
                const scrapedProduct = await scrapeAmazonProduct(currentProduct.url)

                if(!scrapedProduct) throw new Error("No Product Found");

                const updatedPriceHistory = [
                    ...currentProduct.priceHistory,
                    {price : scrapedProduct.currentPrice}
                ]

                const product = {
                    ...scrapedProduct,
                    priceHistory: updatedPriceHistory,
                    lowestPrice: getLowestPrice(updatedPriceHistory),
                    highestPrice: getHighestPrice(updatedPriceHistory),
                    averagePrice:getAveragePrice(updatedPriceHistory)
                }

                const updatedProduct = await Product.findOneAndUpdate(
                    {url: product.url},
                    product
                );

                // 2. check each product's status and send email accordingly
                const emailNotifiType = getEmailNotifType(scrapedProduct, currentProduct);

                if(emailNotifiType && updatedProduct.users.length > 0) {
                    const productInfo = {
                        title: updatedProduct.title,
                        url: updatedProduct.url
                    }

                    const emailcontent = await generateEmailBody(productInfo, emailNotifiType);
                    
                    const userEmails = updatedProduct.users.map((user: any) => user.email)

                    await sendEmail(emailcontent, userEmails)
                }

                return updatedProduct
            })
        )

        return NextResponse.json({
            message:'Ok', data: updatedProducts
        })
    } catch (error) {
        throw new Error(`Error in GET:${error}`)
    }
}