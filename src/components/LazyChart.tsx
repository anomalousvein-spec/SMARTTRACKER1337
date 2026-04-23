import React, { Suspense } from 'react';
import type { ChartData, ChartOptions, ChartType } from 'chart.js';

const ChartImpl = React.lazy(async () => {
  const [{ Chart }, chartJs] = await Promise.all([
    import('react-chartjs-2'),
    import('chart.js'),
  ]);

  const {
    Chart: ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
  } = chartJs;

  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
  );

  return {
    default: Chart,
  };
});

interface LazyChartProps<TType extends ChartType> {
  type: TType;
  data: ChartData<TType>;
  options?: ChartOptions<TType>;
  fallbackClassName?: string;
}

function LazyChart<TType extends ChartType>({
  type,
  data,
  options,
  fallbackClassName = 'h-full w-full rounded-2xl bg-theme-bg-tertiary/60 animate-pulse',
}: LazyChartProps<TType>) {
  const ChartComponent = ChartImpl as React.ComponentType<{
    type: ChartType;
    data: ChartData<ChartType>;
    options?: ChartOptions<ChartType>;
  }>;

  return (
    <Suspense fallback={<div className={fallbackClassName} aria-hidden="true" />}>
      <ChartComponent
        type={type}
        data={data as ChartData<ChartType>}
        options={options as ChartOptions<ChartType> | undefined}
      />
    </Suspense>
  );
}

export default LazyChart;
