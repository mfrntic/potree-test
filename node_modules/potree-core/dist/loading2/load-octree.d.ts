import { GetUrlFn, XhrRequest } from '../loading/types';
export declare function loadOctree(url: string, getUrl: GetUrlFn, xhrRequest: XhrRequest): Promise<import("./OctreeGeometry").OctreeGeometry>;
