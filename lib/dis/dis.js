class DIS {
    constructor(options) {
        options = options || { };
        this.name = options.name || 'Wahoo KICKR';
        this.systemId = options.systemId || '1';
        this.modelNumber = options.modelNumber || '2';
        this.serialNumber = options.serialNumber || '5E09';
        this.firmwareRevision = options.firmwareRevision || '2.3.63';
        this.hardwareRevision = options.hardwareRevision || '1.0';
        this.softwareRevision = options.softwareRevision || '1.0';
        this.manufacturerName = options.manufacturerName || 'Wahoo';
        this.certification = options.certification || 0;
        this.pnpId = options.pnpId || 0;
    }
}

module.exports = DIS;