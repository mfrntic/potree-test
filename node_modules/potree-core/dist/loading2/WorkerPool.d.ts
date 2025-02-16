export declare enum WorkerType {
    DECODER_WORKER_BROTLI = "DECODER_WORKER_BROTLI",
    DECODER_WORKER = "DECODER_WORKER"
}
export declare class WorkerPool {
    private workers;
    getWorker(workerType: WorkerType): Worker;
    returnWorker(workerType: WorkerType, worker: Worker): void;
}
