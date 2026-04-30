declare module "@google-cloud/compute" {
  export class InstancesClient {
    list(options: {
      project: string;
      zone: string;
      filter?: string;
      maxResults?: number;
      pageToken?: string;
    }): Promise<[Array<{
      id?: string | number;
      name?: string;
      machineType?: string;
      status?: string;
      creationTimestamp?: string;
      description?: string;
      tags?: { items?: string[] };
      networkInterfaces?: Array<{
        network?: string;
        subnetwork?: string;
        networkIP?: string;
        accessConfigs?: Array<{
          name?: string;
          type?: string;
          natIP?: string;
        }>;
      }>;
      disks?: Array<{
        deviceName?: string;
        mode?: string;
        source?: string;
        type?: string;
        boot?: boolean;
      }>;
    }>, unknown, { nextPageToken?: string }]>;
    get(options: {
      project: string;
      zone: string;
      instance: string;
    }): Promise<[{
      id?: string | number;
      name?: string;
      machineType?: string;
      status?: string;
      creationTimestamp?: string;
      description?: string;
      tags?: { items?: string[] };
      networkInterfaces?: Array<{
        network?: string;
        subnetwork?: string;
        networkIP?: string;
        accessConfigs?: Array<{
          name?: string;
          type?: string;
          natIP?: string;
        }>;
      }>;
      disks?: Array<{
        deviceName?: string;
        mode?: string;
        source?: string;
        type?: string;
        boot?: boolean;
      }>;
    }]>;
  }

  export class ZonesClient {
    list(options: {
      project: string;
      filter?: string;
    }): Promise<[Array<{
      name?: string;
      region?: string;
      status?: string;
      selfLink?: string;
    }>]>;
  }
}
