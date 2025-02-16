import { XhrRequest } from './../loading/types';
import { PointAttributes } from './PointAttributes';
import { WorkerPool } from './WorkerPool';
import { OctreeGeometryNode } from './OctreeGeometryNode';
import { OctreeGeometry } from './OctreeGeometry';
export declare class NodeLoader {
    url: string;
    workerPool: WorkerPool;
    metadata: Metadata;
    attributes?: PointAttributes;
    scale?: [number, number, number];
    offset?: [number, number, number];
    constructor(url: string, workerPool: WorkerPool, metadata: Metadata);
    load(node: OctreeGeometryNode): Promise<void>;
    parseHierarchy(node: OctreeGeometryNode, buffer: ArrayBuffer): void;
    loadHierarchy(node: OctreeGeometryNode): Promise<void>;
}
declare let typenameTypeattributeMap: {
    double: {
        ordinal: number;
        name: string;
        size: number;
    };
    float: {
        ordinal: number;
        name: string;
        size: number;
    };
    int8: {
        ordinal: number;
        name: string;
        size: number;
    };
    uint8: {
        ordinal: number;
        name: string;
        size: number;
    };
    int16: {
        ordinal: number;
        name: string;
        size: number;
    };
    uint16: {
        ordinal: number;
        name: string;
        size: number;
    };
    int32: {
        ordinal: number;
        name: string;
        size: number;
    };
    uint32: {
        ordinal: number;
        name: string;
        size: number;
    };
    int64: {
        ordinal: number;
        name: string;
        size: number;
    };
    uint64: {
        ordinal: number;
        name: string;
        size: number;
    };
};
type AttributeType = keyof typeof typenameTypeattributeMap;
export interface Attribute {
    name: string;
    description: string;
    size: number;
    numElements: number;
    type: AttributeType;
    min: number[];
    max: number[];
}
export interface Metadata {
    version: string;
    name: string;
    description: string;
    points: number;
    projection: string;
    hierarchy: {
        firstChunkSize: number;
        stepSize: number;
        depth: number;
    };
    offset: [number, number, number];
    scale: [number, number, number];
    spacing: number;
    boundingBox: {
        min: [number, number, number];
        max: [number, number, number];
    };
    encoding: string;
    attributes: Attribute[];
}
export declare class OctreeLoader {
    workerPool: WorkerPool;
    constructor();
    static parseAttributes(jsonAttributes: Attribute[]): PointAttributes;
    load(url: string, xhrRequest: XhrRequest): Promise<{
        geometry: OctreeGeometry;
    }>;
}
export {};
