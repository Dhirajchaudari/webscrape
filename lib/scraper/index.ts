import axios from "axios";
import * as cheerio from 'cheerio'
import { extractCurrency, extractDescription, extractPrice } from "../utils";

export async function scrapeAmazonProduct(url:string){
    if(!url) return;

    // curl --proxy brd.superproxy.io:22225 --proxy-user brd-customer-hl_7daa3c77-zone-pricewise:jc5w1odjxssr -k https://lumtest.com/myip.json

    // BrightData proxy configuration
    const username = String(process.env.BRIGHT_DATA_USERNAME)
    const password = String(process.env.BRIGHT_DATA_PASSWORD)
    const port = 22225;
    const session_id= (1000000 * Math.random()) | 0;
    const options = {
        auth: {
            username: `${username}-session-${session_id}`,
            password
        },
        host: 'brd.superproxy.io:22225',
        port,
        rejectUnauthorized: false
    }

    try {
        // fetch the product page
        const response = await axios.get(url,options);

        const $ = cheerio.load(response.data)
        const title = $('#productTitle').text().trim()

        const currentPrice = extractPrice(
            $('.priceToPay span.a-price-whole'),
            $('.a.size.base.a-color-price'),
            $('.a-button-selected .a-color-base'),
        )

        const originalPrice = extractPrice(
            $('#priceblock_ourprice'),
            $('.a-price.a-text-price span.a-offscreen'),
            $('#listPrice'),
            $('#priceblock_dealprice'),
            $('.a-size-base.a-color-price')
      
        )

        const outOfStock = $('#availability span').text().trim().toLowerCase() === 'currently unavailable';

        const images =       
        $('#imgBlkFront').attr('data-a-dynamic-image') || 
        $('#landingImage').attr('data-a-dynamic-image') ||
        '{}';

        const description = extractDescription($)

        const imageUrls = Object.keys(JSON.parse(images));
        const currency = extractCurrency($('.a-price-symbol'));
        const discountRate = $('.savingsPercentage').text().replace(/[-%]/g,"");
        const data = {
          url,
          title,
          currentPrice: Number(currentPrice) || Number(originalPrice),
          originalPrice: Number(originalPrice) || Number(currentPrice),
          image:imageUrls[0],
          currency: currency || '₹',
          priceHistory: [],
          discountRate: Number(discountRate),
          isOutOfStock: outOfStock,
          reviewsCount: 100,
          stars:4.5,
          category: 'category',
          description,
          lowestPrice: Number(currentPrice) || Number(originalPrice),
          highestPrice: Number(originalPrice) || Number(currentPrice),
          averagePrice: Number(currentPrice) || Number(originalPrice)
        };
        // console.log(data)
        return data;
    } catch (error:any) {
        throw new Error(`Failed to scrape product: ${error.message}`)
    }

}