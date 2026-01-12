import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMaterial extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    name: string;
    unit: string;
    pricePerUnit: number;
    stock: number;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

const MaterialSchema = new Schema<IMaterial>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: [true, 'Material name is required'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        unit: {
            type: String,
            required: [true, 'Unit is required'],
            trim: true,
            enum: ['kg', 'gram', 'liter', 'ml', 'pcs', 'pack', 'meter', 'cm', 'box'],
        },
        pricePerUnit: {
            type: Number,
            required: [true, 'Price per unit is required'],
            min: [0, 'Price cannot be negative'],
        },
        stock: {
            type: Number,
            default: 0,
            min: [0, 'Stock cannot be negative'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient user-based queries
MaterialSchema.index({ userId: 1, name: 1 }, { unique: true });

const Material: Model<IMaterial> = mongoose.models.Material || mongoose.model<IMaterial>('Material', MaterialSchema);

export default Material;
