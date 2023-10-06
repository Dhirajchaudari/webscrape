import { Product } from "@/types"
import Image from "next/image"
import Link from "next/link"

interface Props{
    product: Product
}

const ProductCart = ({product}: Props) => {
  return (
    <Link href={`/products/${product._id}`}>
        <div className="product-card_img-container">
            <Image
            src={product.image}
            alt={product.title}
            width={200}
            height={200}
            className="product-card_img"
             />
        </div>

        <div className="flex flex-col gap-3">
            <h3 className="product-title">
                {product.title.length > 30 ? `${product.title.slice(0,30)}...`: product.title}
            </h3>

            <div className="flex justify-between">
                <p className="text-black opacity-50 text-lg capitalize">{product.category}</p>

                <p className="text-black text-lg font-semibold">
                    <span>{product?.currency}</span>
                    <span>{product?.currentPrice}</span>
                </p>
            </div>
        </div>
    </Link>
  )
}

export default ProductCart