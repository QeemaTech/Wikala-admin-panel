'use client';

import { addCollection } from '@iconify/react';
import fluentSubset from '@/lib/constants/fluent-icons-data.json';

/**
 * Registers the curated Fluent Emoji 3D subset offline so category icons render
 * without any runtime Iconify API/CDN call. Importing this module for its side
 * effect (once) is enough; addCollection is idempotent. Route-split — only the
 * categories page pulls it in.
 */
addCollection(fluentSubset as Parameters<typeof addCollection>[0]);

export {};
