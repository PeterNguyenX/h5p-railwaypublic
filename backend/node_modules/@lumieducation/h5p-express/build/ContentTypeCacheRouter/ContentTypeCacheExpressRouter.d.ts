import { Router } from 'express';
import { ContentTypeCache } from '@lumieducation/h5p-server';
export default function (contentTypeCache: ContentTypeCache, options?: {
    handleErrors: boolean;
}, languageOverride?: string | 'auto'): Router;
