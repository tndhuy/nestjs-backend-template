"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sdk_node_1 = require("@opentelemetry/sdk-node");
let sdk = null;
if (process.env.OTEL_ENABLED === 'true') {
    try {
        const { resourceFromAttributes } = require('@opentelemetry/resources');
        const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
        const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');
        const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
        const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-base');
        const serviceName = process.env.OTEL_SERVICE_NAME ?? 'nestjs-backend-template';
        const prometheusPort = parseInt(process.env.OTEL_PROMETHEUS_PORT ?? '9464', 10);
        const prometheusExporter = new PrometheusExporter({ port: prometheusPort });
        const traceExporter = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
            ? new OTLPTraceExporter({ url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT })
            : new ConsoleSpanExporter();
        const instrumentations = getNodeAutoInstrumentations({
            '@opentelemetry/instrumentation-dns': { enabled: false },
            '@opentelemetry/instrumentation-fs': { enabled: false },
        });
        sdk = new sdk_node_1.NodeSDK({
            resource: resourceFromAttributes({ 'service.name': serviceName }),
            metricReader: prometheusExporter,
            traceExporter,
            instrumentations,
        });
    }
    catch (err) {
        console.error('[OTel] Failed to initialize OpenTelemetry SDK:', err);
        sdk = null;
    }
}
exports.default = sdk;
//# sourceMappingURL=instrumentation.js.map