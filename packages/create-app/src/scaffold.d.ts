export interface ScaffoldOptions {
    serviceName: string;
    db: 'postgres' | 'mongo';
    modules: string[];
    destDir: string;
}
export declare function removeRedis(destDir: string): Promise<void>;
export declare function removeOtel(destDir: string): Promise<void>;
export declare function addKafka(destDir: string, serviceName: string): Promise<void>;
export declare function scaffold(options: ScaffoldOptions): Promise<void>;
