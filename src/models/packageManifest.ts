import type * as Contract from './generated/contracts';

export default class PackageManifest implements Contract.PackageManifest {
    name: string = "";
    version: string = "";
    date: string  = "";
    installedPackageFilename: string = "";
    // Plugin packages: the RIoT2.Core they were built on, and the hash of the installed zip (Node 1.14.0).
    coreVersion?: string | null;
    sha256?: string | null;
}
