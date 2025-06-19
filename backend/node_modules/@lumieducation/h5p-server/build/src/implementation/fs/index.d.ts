import H5PEditor from '../../H5PEditor';
import { IContentStorage, IContentUserDataStorage, ITranslationFunction, IH5PEditorOptions, IUrlGenerator, IH5PConfig } from '../../types';
export default function h5pfs(config: IH5PConfig, librariesPath: string, temporaryStoragePath: string, contentPath: string, contentUserDataStorage?: IContentUserDataStorage, contentStorage?: IContentStorage, translationCallback?: ITranslationFunction, urlGenerator?: IUrlGenerator, options?: IH5PEditorOptions): H5PEditor;
