import * as H5P from '../../';
import { IContentStorage, ITranslationFunction } from '../../types';
export default function h5pfs(config: H5P.IH5PConfig, librariesPath: string, temporaryStoragePath: string, contentPath: string, contentStorage?: IContentStorage, translationCallback?: ITranslationFunction): H5P.H5PEditor;
