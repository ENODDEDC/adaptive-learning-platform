'use client';

import React from 'react';

const VisualWireframe = ({ wireframeData, contentType, compact = false }) => {
  if (!wireframeData) return null;

  const { title, description, layout, sections = [], style = {} } = wireframeData;

  const getContentTypeStyles = () => {
    switch (contentType) {
      case 'diagram':
        return {
          containerClass: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50',
          sectionClass:
            'bg-white/90 backdrop-blur-sm border-2 border-blue-300/50 shadow-xl hover:shadow-2xl transition-all duration-300',
          titleClass: 'text-blue-900 font-bold',
          connectionClass: 'border-blue-400/60',
          accentClass: 'bg-gradient-to-r from-blue-500 to-indigo-600',
          iconClass: 'text-blue-600'
        };
      case 'infographic':
        return {
          containerClass: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50',
          sectionClass:
            'bg-white/90 backdrop-blur-sm border-2 border-emerald-300/50 shadow-xl hover:shadow-2xl transition-all duration-300',
          titleClass: 'text-emerald-900 font-bold',
          connectionClass: 'border-emerald-400/60',
          accentClass: 'bg-gradient-to-r from-emerald-500 to-teal-600',
          iconClass: 'text-emerald-600'
        };
      case 'mindmap':
        return {
          containerClass: 'bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50',
          sectionClass:
            'bg-white/90 backdrop-blur-sm border-2 border-purple-300/50 shadow-xl hover:shadow-2xl transition-all duration-300',
          titleClass: 'text-purple-900 font-bold',
          connectionClass: 'border-purple-400/60',
          accentClass: 'bg-gradient-to-r from-purple-500 to-pink-600',
          iconClass: 'text-purple-600'
        };
      case 'flowchart':
        return {
          containerClass: 'bg-gradient-to-br from-amber-50 via-orange-50 to-red-50',
          sectionClass:
            'bg-white/90 backdrop-blur-sm border-2 border-orange-300/50 shadow-xl hover:shadow-2xl transition-all duration-300',
          titleClass: 'text-orange-900 font-bold',
          connectionClass: 'border-orange-400/60',
          accentClass: 'bg-gradient-to-r from-orange-500 to-red-600',
          iconClass: 'text-orange-600'
        };
      default:
        return {
          containerClass: 'bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50',
          sectionClass:
            'bg-white/90 backdrop-blur-sm border-2 border-gray-300/50 shadow-xl hover:shadow-2xl transition-all duration-300',
          titleClass: 'text-gray-900 font-bold',
          connectionClass: 'border-gray-400/60',
          accentClass: 'bg-gradient-to-r from-gray-500 to-slate-600',
          iconClass: 'text-gray-600'
        };
    }
  };

  const styles = getContentTypeStyles();
  const hubLabel = title || 'Core idea';

  /** Hub + spokes + dashed connectors — how visual learners map relations */
  const renderHubSpokeMap = () => {
    const spokes = sections.length ? sections : [{ id: 'x', title: 'Idea', content: ['—'] }];
    const n = Math.max(spokes.length, 1);
    const rPct = contentType === 'mindmap' ? 34 : 32;
    return (
      <div className="mx-auto w-full">
        {!compact ? (
          <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Spatial map — start at the hub, then follow each spoke outward
          </p>
        ) : null}
        <div
          className={`relative mx-auto aspect-[16/9] w-full min-h-[160px] max-h-[min(44vh,360px)] ${
            compact ? 'max-h-[min(38vh,300px)]' : ''
          }`}
        >
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full text-slate-400"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            {spokes.map((_, i) => {
              const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
              const x2 = 50 + rPct * Math.cos(angle);
              const y2 = 50 + rPct * Math.sin(angle);
              return (
                <line
                  key={i}
                  x1="50"
                  y1="50"
                  x2={x2}
                  y2={y2}
                  stroke="currentColor"
                  strokeWidth="0.55"
                  strokeDasharray="1.4 1.2"
                  strokeOpacity="0.5"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>
          <div className="absolute left-1/2 top-1/2 z-10 w-[min(44%,172px)] -translate-x-1/2 -translate-y-1/2">
            <div className={`${styles.accentClass} rounded-2xl border-2 border-white/80 p-3 text-center shadow-xl`}>
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/90">Hub</p>
              <p className="mt-1 text-sm font-bold leading-snug text-white line-clamp-4">{hubLabel}</p>
            </div>
          </div>
          {spokes.map((section, i) => {
            const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
            const xr = rPct + 4;
            const x = 50 + xr * Math.cos(angle);
            const y = 50 + xr * Math.sin(angle);
            const accent = section.color || style.primaryColor;
            return (
              <div
                key={section.id || i}
                className="absolute z-10 w-[min(28%,136px)] -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <div
                  className="rounded-xl border-2 bg-white/95 px-2 py-2 shadow-md ring-1 ring-black/5"
                  style={{ borderColor: accent || '#94a3b8' }}
                >
                  <p className="text-center text-[11px] font-bold leading-tight text-gray-900 line-clamp-3">
                    {section.title}
                  </p>
                  <ul className="mt-1 space-y-0.5 border-t border-slate-100 pt-1">
                    {(section.content || []).slice(0, 2).map((item, j) => (
                      <li key={j} className="text-[10px] leading-snug text-gray-600 line-clamp-2">
                        • {String(item)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /** Left-to-right process — matches sequential / visual-chunk reading */
  const renderProcessStrip = () => {
    if (!sections.length) {
      return <p className="py-6 text-center text-sm text-gray-500">No process steps in this view.</p>;
    }
    return (
      <div className="mx-auto w-full">
        <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Timeline — read in order, same as the flow in your document
        </p>
        <div className="relative rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 px-2 py-3 sm:px-4 sm:py-4">
          <div className="flex flex-wrap items-stretch justify-center gap-1 sm:flex-nowrap sm:gap-2">
            {sections.map((section, index) => (
              <React.Fragment key={section.id || index}>
                {index > 0 ? (
                  <div className="hidden shrink-0 items-center self-center px-1 text-lg text-slate-400 sm:flex" aria-hidden="true">
                    →
                  </div>
                ) : null}
                <div className="flex min-w-0 flex-[1_1_120px] flex-col items-center text-center sm:flex-[1_1_0]">
                  <div
                    className={`${styles.accentClass} mb-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-md`}
                  >
                    {index + 1}
                  </div>
                  <div className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2 shadow-sm">
                    <p className="text-[11px] font-bold leading-tight text-gray-900">{section.title}</p>
                    {section.content?.slice(0, 1).map((line, li) => (
                      <p key={li} className="mt-1 text-[10px] leading-snug text-gray-600">
                        {String(line)}
                      </p>
                    ))}
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /** Big numerals + color rails — scan before reading detail */
  const renderInfographicStrip = () => {
    const top = sections.slice(0, 4);
    const rest = sections.slice(4);
    return (
      <div className="mx-auto w-full">
        <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Pattern board — numbers are anchors; color shows separate chunks
        </p>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
          {top.map((section, i) => (
            <div
              key={section.id || i}
              className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-md"
            >
              <div
                className="absolute left-0 top-0 h-full w-1.5 rounded-full"
                style={{ backgroundColor: section.color || style.primaryColor || '#6366f1' }}
              />
              <div className="pl-3">
                <p
                  className="font-black tabular-nums leading-none text-slate-200"
                  style={{ fontSize: compact ? '1.65rem' : '2.1rem' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </p>
                <h4 className="-mt-0.5 text-xs font-bold leading-tight text-gray-900">{section.title}</h4>
                <p className="mt-1 text-[10px] leading-snug text-gray-600 line-clamp-4">
                  {(section.content || [])[0] != null ? String((section.content || [])[0]) : '—'}
                </p>
              </div>
            </div>
          ))}
        </div>
        {rest.length > 0 ? (
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {rest.map((section, i) => (
              <div key={section.id || `r${i}`} className="flex gap-2 rounded-lg border border-slate-200 bg-white/90 p-2">
                <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${styles.accentClass}`} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-900">{section.title}</p>
                  <p className="text-[10px] text-gray-600 line-clamp-3">
                    {(section.content || []).map((c) => String(c)).join(' · ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  const renderGridLayout = () => (
    <div className="mx-auto grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
      {sections.map((section, index) => (
        <div key={section.id || index} className="rounded-xl border border-slate-200 bg-white/95 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className={`h-6 w-1 shrink-0 rounded-full ${styles.accentClass}`} />
            <h4 className="text-sm font-bold text-gray-900">{section.title}</h4>
          </div>
          <ul className="mt-2 space-y-1">
            {(section.content || []).map((item, i) => (
              <li key={i} className="text-[11px] leading-snug text-gray-600">
                • {String(item)}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );

  const renderLayout = () => {
    if (contentType === 'diagram' || contentType === 'mindmap' || layout?.type === 'radial') {
      return renderHubSpokeMap();
    }
    if (layout?.type === 'stack' || contentType === 'flowchart') {
      return renderProcessStrip();
    }
    if (layout?.type === 'flex' || contentType === 'infographic') {
      return renderInfographicStrip();
    }
    return renderGridLayout();
  };

  return (
    <div
      className={`${styles.containerClass} relative h-full overflow-hidden border-white/20 shadow-2xl ${
        compact ? 'rounded-2xl border p-3 sm:p-4' : 'rounded-3xl border-2 p-8'
      }`}
    >
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, ${styles.iconClass.replace('text-', '#')} 0%, transparent 50%), radial-gradient(circle at 75% 75%, ${styles.iconClass.replace('text-', '#')} 0%, transparent 50%)`
          }}
        />
      </div>

      <div className={`relative z-10 text-center ${compact ? 'mb-3' : 'mb-8'}`}>
        <div className={`inline-flex items-center gap-3 ${compact ? 'mb-2' : 'mb-4'}`}>
          <div
            className={`${styles.accentClass} flex items-center justify-center rounded-2xl shadow-lg ${
              compact ? 'h-9 w-9' : 'h-12 w-12'
            }`}
          >
            <svg
              className={`text-white ${compact ? 'h-5 w-5' : 'h-7 w-7'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h3 className={`font-bold ${styles.titleClass} drop-shadow-sm ${compact ? 'text-lg' : 'text-2xl'}`}>
            {title || `${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`}
          </h3>
        </div>

        {description ? (
          <p
            className={`mx-auto max-w-2xl leading-relaxed text-gray-600 ${
              compact ? 'text-xs sm:text-sm' : 'text-base'
            }`}
          >
            {description}
          </p>
        ) : null}

        <div className={`flex items-center justify-center ${compact ? 'mt-2' : 'mt-4'}`}>
          <div className={`h-1 w-16 ${styles.accentClass} rounded-full`} />
        </div>
      </div>

      <div className="relative z-10 flex-1 min-h-0">{renderLayout()}</div>

      <div className="absolute right-4 top-4 h-8 w-8 rounded-tr-2xl border-r-2 border-t-2 border-white/30" />
      <div className="absolute bottom-4 left-4 h-8 w-8 rounded-bl-2xl border-b-2 border-l-2 border-white/30" />
    </div>
  );
};

export default VisualWireframe;
