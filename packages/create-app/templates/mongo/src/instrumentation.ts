import { NodeSDK } from '@opentelemetry/sdk-node';

let sdk: NodeSDK | null = null;

if (process.env.OTEL_ENABLED === 'true') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { resourceFromAttributes } = require('@opentelemetry/resources');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
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

    sdk = new NodeSDK({
      resource: resourceFromAttributes({ 'service.name': serviceName }),
      metricReader: prometheusExporter,
      traceExporter,
      instrumentations,
    });
  } catch (err) {
    console.error('[OTel] Failed to initialize OpenTelemetry SDK:', err);
    sdk = null;
  }
}

export default sdk;
