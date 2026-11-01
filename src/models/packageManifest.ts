import type * as Contract from './generated/contracts';

export default class PackageManifest implements Contract.PackageManifest {
    name: string = "";
    version: string = "";
    date: string  = "";
    installedPackageFilename: string = "";
}
