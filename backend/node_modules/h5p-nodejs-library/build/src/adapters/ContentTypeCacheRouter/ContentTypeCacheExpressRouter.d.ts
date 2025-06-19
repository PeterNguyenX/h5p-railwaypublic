import { Router } from 'express';
import ContentTypeCache from '../../ContentTypeCache';
export default function (contentTypeCache: ContentTypeCache, options?: {
    handleErrors: boolean;
}, languageOverride?: string | 'auto'): Router;
