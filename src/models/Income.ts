import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IIncome extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    date: Date;
    productId: mongoose.Types.ObjectId;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    customerName?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const IncomeSchema = new Schema<IIncome>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        date: {
            type: Date,
            required: [true, 'Date is required'],
            default: Date.now,
        },
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'Product is required'],
        },
        quantity: {
            type: Number,
            required: [true, 'Quantity is required'],
            min: [1, 'Quantity must be at least 1'],
        },
        unitPrice: {
            type: Number,
            required: [true, 'Unit price is required'],
            min: [0, 'Unit price cannot be negative'],
        },
        totalAmount: {
            type: Number,
            required: [true, 'Total amount is required'],
            min: [0, 'Total amount cannot be negative'],
        },
        customerName: {
            type: String,
            trim: true,
            maxlength: [100, 'Customer name cannot exceed 100 characters'],
        },
        notes: {
            type: String,
            trim: true,
            maxlength: [500, 'Notes cannot exceed 500 characters'],
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient querying
IncomeSchema.index({ userId: 1, date: -1 });
IncomeSchema.index({ userId: 1, productId: 1 });

const Income: Model<IIncome> = mongoose.models.Income || mongoose.model<IIncome>('Income', IncomeSchema);

export default Income;
