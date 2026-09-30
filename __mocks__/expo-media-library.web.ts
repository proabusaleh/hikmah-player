export const AssetField = { MEDIA_TYPE: 'mediaType', CREATION_TIME: 'creationTime' } as const;
export const MediaType = { AUDIO: 'audio', VIDEO: 'video', IMAGE: 'image', UNKNOWN: 'unknown' } as const;
export type PermissionResponse = { status: string; granted: boolean; canAskAgain: boolean; accessPrivileges?: string };

export function getPermissionsAsync(): Promise<PermissionResponse> {
  return Promise.resolve({ status: 'undetermined', granted: false, canAskAgain: true, accessPrivileges: 'none' });
}

export function requestPermissionsAsync(): Promise<PermissionResponse> {
  return Promise.resolve({ status: 'denied', granted: false, canAskAgain: true, accessPrivileges: 'none' });
}

export class Asset {
  constructor(public id: string) {}
  async getUri() {
    return null;
  }
}

export class Query {
  eq() { return this; }
  orderBy() { return this; }
  limit() { return this; }
  offset() { return this; }
  async exeForMetadata() {
    return [];
  }
}

export class Album {}
