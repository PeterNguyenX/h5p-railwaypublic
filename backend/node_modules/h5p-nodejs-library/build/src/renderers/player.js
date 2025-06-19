"use strict";
exports.__esModule = true;
exports["default"] = (function (model) { return "<!doctype html>\n<html class=\"h5p-iframe\">\n<head>\n    <meta charset=\"utf-8\">\n   \n    " + model.styles
    .map(function (style) { return "<link rel=\"stylesheet\" href=\"" + style + "\"/>"; })
    .join('\n    ') + "\n    " + model.scripts
    .map(function (script) { return "<script src=\"" + script + "\"></script>"; })
    .join('\n    ') + "\n\n    <script>\n        window.H5PIntegration = " + JSON.stringify(model.integration, null, 2) + ";\n    </script>\n</head>\n<body>\n    <div class=\"h5p-content\" data-content-id=\"" + model.contentId + "\"></div>\n    <a href=\"" + model.downloadPath + "\">Download</button>\n</body>\n</html>"; });
//# sourceMappingURL=player.js.map