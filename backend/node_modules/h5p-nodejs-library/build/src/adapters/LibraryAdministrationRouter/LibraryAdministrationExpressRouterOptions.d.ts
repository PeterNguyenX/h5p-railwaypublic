/**
 * Allows you to choose which routes you want in the Express Router
 */
export default class LibraryAdministrationExpressRouterOptions {
    handleErrors?: boolean;
    routeDeleteLibrary?: boolean;
    routeGetLibraries?: boolean;
    routeGetLibrary?: boolean;
    routePatchLibrary?: boolean;
    routePostLibraries?: boolean;
}
