import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProductMaterial {
    materialId: mongoose.Types.ObjectId;
    quantity: number;
}

export interface IProduct extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    sellingPrice: number;
    materials: IProductMaterial[];
    hpp: number; // Harga Pokok Produksi (calculated)
    createdAt: Date;
    updatedAt: Date;
}

const ProductMaterialSchema = new Schema<IProductMaterial>(
    {
        materialId: {
            type: Schema.Types.ObjectId,
            ref: 'Material',
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: [0, 'Quantity cannot be negative'],
        },
    },
    { _id: false }
);

const ProductSchema = new Schema<IProduct>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        sellingPrice: {
            type: Number,
            required: [true, 'Selling price is required'],
            min: [0, 'Price cannot be negative'],
        },
        materials: [ProductMaterialSchema],
        hpp: {
            type: Number,
            default: 0,
            min: [0, 'HPP cannot be negative'],
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient user-based queries
ProductSchema.index({ userId: 1, name: 1 }, { unique: true });

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
