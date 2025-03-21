declare module "react-h5p" {
    import { Component } from "react";

    interface H5PProps {
        h5pJson: string;
    }

    class H5PPlayer extends Component<H5PProps> {}

    export default H5PPlayer;
}
