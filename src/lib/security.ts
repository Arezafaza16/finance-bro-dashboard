import { NextResponse } from 'next/server';

// =============================================================================
// RATE LIMITER
// =============================================================================

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// In-memory store for rate limiting (resets on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per window

/**
 * Check if a user has exceeded the rate limit
 * @param userId - The user ID to check
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const key = `rate:${userId}`;
    const entry = rateLimitStore.get(key);

    // Clean up expired entries
    if (entry && now > entry.resetTime) {
        rateLimitStore.delete(key);
    }

    const currentEntry = rateLimitStore.get(key);

    if (!currentEntry) {
        // First request in window
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + RATE_LIMIT_WINDOW_MS,
        });
        return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
    }

    if (currentEntry.count >= RATE_LIMIT_MAX_REQUESTS) {
        return { allowed: false, remaining: 0, resetTime: currentEntry.resetTime };
    }

    // Increment count
    currentEntry.count++;
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - currentEntry.count, resetTime: currentEntry.resetTime };
}

/**
 * Create a rate limit exceeded response
 */
export function rateLimitResponse(resetTime: number): NextResponse {
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
    return NextResponse.json(
        { error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' },
        {
            status: 429,
            headers: {
                'Retry-After': String(retryAfter),
                'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000)),
            },
        }
    );
}

// =============================================================================
// RESPONSE SANITIZERS
// =============================================================================

interface MongoDocument {
    _id?: { toString(): string } | string;
    userId?: unknown; // Can be string or ObjectId
    __v?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    [key: string]: unknown;
}

/**
 * Base sanitizer - removes internal MongoDB fields
 */
function sanitizeBase<T extends MongoDocument>(doc: T, allowedFields: string[]): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    // Convert _id to id
    if (doc._id) {
        result.id = typeof doc._id === 'string' ? doc._id : doc._id.toString();
    }

    // Only include allowed fields
    for (const field of allowedFields) {
        if (field in doc && doc[field] !== undefined) {
            result[field] = doc[field];
        }
    }

    return result;
}

/**
 * Sanitize income data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sanitizeIncome(doc: any): Record<string, unknown> {
    const sanitized = sanitizeBase(doc, [
        'date',
        'quantity',
        'unitPrice',
        'totalAmount',
        'customerName',
        'notes',
        'createdAt',
    ]);

    // Handle populated productId
    if (doc.productId && typeof doc.productId === 'object') {
        const product = doc.productId;
        sanitized.product = {
            id: product._id ? (typeof product._id === 'string' ? product._id : product._id.toString()) : undefined,
            name: product.name,
            sellingPrice: product.sellingPrice,
        };
    } else if (doc.productId) {
        sanitized.productId = doc.productId;
    }

    return sanitized;
}

/**
 * Sanitize expense data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sanitizeExpense(doc: any): Record<string, unknown> {
    const sanitized = sanitizeBase(doc, [
        'date',
        'description',
        'category',
        'quantity',
        'amount',
        'createdAt',
    ]);

    // Handle populated productId
    if (doc.productId && typeof doc.productId === 'object') {
        const product = doc.productId;
        sanitized.product = {
            id: product._id ? (typeof product._id === 'string' ? product._id : product._id.toString()) : undefined,
            name: product.name,
        };
    }

    // Handle populated materialId
    if (doc.materialId && typeof doc.materialId === 'object') {
        const material = doc.materialId;
        sanitized.material = {
            id: material._id ? (typeof material._id === 'string' ? material._id : material._id.toString()) : undefined,
            name: material.name,
            unit: material.unit,
        };
    }

    return sanitized;
}

/**
 * Sanitize product data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sanitizeProduct(doc: any): Record<string, unknown> {
    const sanitized = sanitizeBase(doc, [
        'name',
        'description',
        'sellingPrice',
        'hpp',
        'createdAt',
    ]);

    // Handle materials array with populated materialId
    if (Array.isArray(doc.materials)) {
        sanitized.materials = doc.materials.map((m: { materialId?: MongoDocument; quantity?: number }) => {
            if (m.materialId && typeof m.materialId === 'object') {
                const material = m.materialId as MongoDocument;
                return {
                    material: {
                        id: material._id ? (typeof material._id === 'string' ? material._id : material._id.toString()) : undefined,
                        name: material.name,
                        unit: material.unit,
                        pricePerUnit: material.pricePerUnit,
                    },
                    quantity: m.quantity,
                };
            }
            return { materialId: m.materialId, quantity: m.quantity };
        });
    }

    return sanitized;
}

/**
 * Sanitize material data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sanitizeMaterial(doc: any): Record<string, unknown> {
    return sanitizeBase(doc, [
        'name',
        'unit',
        'pricePerUnit',
        'stock',
        'description',
        'createdAt',
    ]);
}

/**
 * Sanitize user/account data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sanitizeUser(doc: any): Record<string, unknown> {
    return sanitizeBase(doc, [
        'name',
        'email',
        'phone',
        'passwordChangedAt',
        'createdAt',
    ]);
}

// =============================================================================
// ARRAY SANITIZERS
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sanitizeIncomeList(docs: any[]): Record<string, unknown>[] {
    return docs.map(sanitizeIncome);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sanitizeExpenseList(docs: any[]): Record<string, unknown>[] {
    return docs.map(sanitizeExpense);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sanitizeProductList(docs: any[]): Record<string, unknown>[] {
    return docs.map(sanitizeProduct);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sanitizeMaterialList(docs: any[]): Record<string, unknown>[] {
    return docs.map(sanitizeMaterial);
}
