import type { PartId } from "@/lib/kit-state";

interface Props {
  colors: Record<PartId, string>;
  onPartClick?: (part: PartId) => void;
}

const partStyle = (color: string): React.CSSProperties => ({
  fill: color,
  stroke: "#818281",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  transition: "fill 220ms ease",
  cursor: "pointer",
});

const stitch: React.CSSProperties = {
  fill: "none",
  stroke: "#818281",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function UniformCostas({ colors, onPartClick }: Props) {
  const click = (p: PartId) => () => onPartClick?.(p);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1920 1080"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <g id="shorts" onClick={click("shorts")}>
        <path style={partStyle(colors.shorts)} d="M1220.6,865.7c-8.7-91.9-33.6-182.7-33.6-182.7l-186,19.3-186-19.3s-25,90.8-33.6,182.7c-8.7,91.9-12.3,125.1-12.3,125.1,0,0,76.1,50,200.2,16.3,0,0,14-143,31.7-151.7,17.8,8.7,31.7,151.7,31.7,151.7,124.1,33.7,200.2-16.3,200.2-16.3,0,0-3.6-33.2-12.3-125.1Z" />
      </g>
      <g id="mangas" onClick={click("sleeves")}>
        <path style={partStyle(colors.sleeves)} d="M1279.5,229.4c-.4-31.6-1.8-48.8-22.1-83.7-17.5-30.1-90.7-51.3-90.7-51.3l-77.6-36.1h-176.2l-77.6,36.1s-73.2,21.3-90.7,51.3c-20.3,34.8-21.7,52.1-22.1,83.7-.5,33.7-20.1,93.6-21.8,100.4,0,0,42.6,31.3,105.9,26.2l22.8-88.5h343.3l22.8,88.5c63.3,5.1,105.9-26.2,105.9-26.2-1.7-6.8-21.3-66.7-21.8-100.4Z" />
      </g>
      <g id="camisa" onClick={click("body")}>
        <path style={partStyle(colors.body)} d="M1172.2,313.5c1.5-12.3,29.1-98,7.7-139.4-21.4-41.4-120.3-111.4-120.3-111.4h-117.2s-98.8,70-120.3,111.4c-21.4,41.4,6.1,127.1,7.7,139.4,1.5,12.3,33.4,178.3-15.8,373.5,0,0,62.1,27.6,187,22.5,124.9,5.1,187-22.5,187-22.5-49.2-195.2-17.3-361.3-15.8-373.5Z" />
      </g>
      <g id="gola" onClick={click("collar")}>
        <path style={partStyle(colors.collar)} d="M1084.7,41.3s-66.9,8.2-83.8,7.7c-16.8.5-83.8-7.7-83.8-7.7-9.4,7.4-18.3,23.6-18.3,23.6,17.1,11.7,102.1,11.1,102.1,11.1,0,0,85,.6,102.1-11.1,0,0-8.9-16.2-18.3-23.6Z" />
      </g>
      <g id="costuras" style={{ pointerEvents: "none" }}>
        <path style={stitch} d="M705.9,312s35.1,29.3,104.8,27.8" />
        <path style={stitch} d="M704.2,316.7s35.1,29.3,104.8,27.8" />
        <line style={stitch} x1="821.7" y1="278.2" x2="800.5" y2="356.4" />
        <path style={stitch} d="M1296,312s-35.1,29.3-104.8,27.8" />
        <path style={stitch} d="M1297.7,316.7s-35.1,29.3-104.8,27.8" />
        <line style={stitch} x1="1180.1" y1="278.2" x2="1201.3" y2="356.4" />
        <path style={stitch} d="M818.3,669.1s178.9,46.7,365.5,0" />
        <path style={stitch} d="M818.3,674.9s178.9,46.7,365.5,0" />
        <path style={stitch} d="M771,972.6s76.6,48.6,199.9,19.2" />
        <path style={stitch} d="M771,977.3s76.6,48.6,199.9,19.2" />
        <path style={stitch} d="M1230.9,972.6s-76.6,48.6-199.9,19.2" />
        <path style={stitch} d="M1230.9,977.3s-76.6,48.6-199.9,19.2" />
      </g>
    </svg>
  );
}