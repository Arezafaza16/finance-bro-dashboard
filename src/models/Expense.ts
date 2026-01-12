import mongoose, { Schema, Document, Model } from 'mongoose';

export type ExpenseCategory = 'bahan_baku' | 'produksi' | 'operasional';

export interface IExpense extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    date: Date;
    description: string;
    category: ExpenseCategory;
    productId?: mongoose.Types.ObjectId;
    materialId?: mongoose.Types.ObjectId;
    quantity?: number;
    amount: number;
    createdAt: Date;
    updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
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
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            maxlength: [200, 'Description cannot exceed 200 characters'],
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            enum: ['bahan_baku', 'produksi', 'operasional'],
        },
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
        },
        materialId: {
            type: Schema.Types.ObjectId,
            ref: 'Material',
        },
        quantity: {
            type: Number,
            min: [0, 'Quantity cannot be negative'],
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: [0, 'Amount cannot be negative'],
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient querying
ExpenseSchema.index({ userId: 1, date: -1 });
ExpenseSchema.index({ userId: 1, category: 1 });
ExpenseSchema.index({ userId: 1, productId: 1 });

const Expense: Model<IExpense> = mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

export default Expense;
