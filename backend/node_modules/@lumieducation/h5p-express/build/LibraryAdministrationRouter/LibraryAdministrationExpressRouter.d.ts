import { Router } from 'express';
import { H5PEditor } from '@lumieducation/h5p-server';
import LibraryAdministrationExpressRouterOptions from './LibraryAdministrationExpressRouterOptions';
export default function (h5pEditor: H5PEditor, routeOptions?: LibraryAdministrationExpressRouterOptions, languageOverride?: string | 'auto'): Router;
