import { forwardRef } from "react";
import type { KitState, PartId } from "@/lib/kit-state";

interface Props {
  state: KitState;
  onPartClick?: (p: PartId) => void;
  interactive?: boolean;
}

const stroke = { stroke: "#818281", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const stitchStyle: React.CSSProperties = { fill: "none", stroke: "#818281", strokeLinecap: "round", strokeLinejoin: "round" };

const FRONT = {
  body: "M711.2,323.4c1.5-12.3,29.1-98,7.7-139.4-21.4-41.4-100.3-78.9-100.3-78.9l-78.6,31.3-78.6-31.3s-78.8,37.5-100.3,78.9c-21.4,41.4,6.1,127.1,7.7,139.4,1.5,12.3,33.4,178.3-15.8,373.5,0,0,62.1,27.6,187,22.5,124.9,5.1,187-22.5,187-22.5-49.2-195.2-17.3-361.3-15.8-373.5Z",
  sleeves: "M818.6,239.4c-.4-31.6-1.8-48.8-22.1-83.7-17.5-30.1-90.7-51.3-90.7-51.3l-77.6-36.1h-176.2l-77.6,36.1s-73.2,21.3-90.7,51.3c-20.3,34.8-21.7,52.1-22.1,83.7-.5,33.7-20.1,93.6-21.8,100.4,0,0,42.6,31.3,105.9,26.2l22.8-88.5h343.3l22.8,88.5c63.3,5.1,105.9-26.2,105.9-26.2-1.7-6.8-21.3-66.7-21.8-100.4Z",
  collar: [
    "M619.3,51.3s-60.3,9.6-79.3,8.6c-19.1,1-79.3-8.6-79.3-8.6-3.4,8.1-2,22.2-2,22.2,20.1,11.9,81.4,10.6,81.4,10.6,0,0,61.3,1.4,81.4-10.6,0,0,1.4-14.1-2-22.2Z",
    "M460.7,51.3s-7.5,52.8,79.3,75.6v19.4s-84.9-16.7-95.7-74.4c0,0,8.2-16.1,16.3-20.5Z",
    "M619.3,51.3s7.5,52.8-79.3,75.6v19.4s84.9-16.7,95.7-74.4c0,0-8.2-16.1-16.3-20.5Z",
  ],
};

const BACK = {
  body: "M711.2,323.5c1.5-12.3,29.1-98,7.7-139.4-21.4-41.4-120.3-111.4-120.3-111.4h-117.2s-98.8,70-120.3,111.4c-21.4,41.4,6.1,127.1,7.7,139.4,1.5,12.3,33.4,178.3-15.8,373.5,0,0,62.1,27.6,187,22.5,124.9,5.1,187-22.5,187-22.5-49.2-195.2-17.3-361.3-15.8-373.5Z",
  sleeves: FRONT.sleeves,
  collar: ["M623.8,51.2s-66.9,8.2-83.8,7.7c-16.8.5-83.8-7.7-83.8-7.7-9.4,7.4-18.3,23.6-18.3,23.6,17.1,11.7,102.1,11.1,102.1,11.1,0,0,85,.6,102.1-11.1,0,0-8.9-16.2-18.3-23.6Z"],
};

const SHORTS_D = "M759.7,875.6c-8.7-91.9-33.6-182.7-33.6-182.7l-186,19.3-186-19.3s-25,90.8-33.6,182.7c-8.7,91.9-12.3,125.1-12.3,125.1,0,0,76.1,50,200.2,16.3,0,0,14-143,31.7-151.7,17.8,8.7,31.7,151.7,31.7,151.7,124.1,33.7,200.2-16.3,200.2-16.3,0,0-3.6-33.2-12.3-125.1Z";

export const KitSvg = forwardRef<SVGSVGElement, Props>(({ state, onPartClick, interactive = true }, ref) => {
  const { partColors, view } = state;
  const G = view === "front" ? FRONT : BACK;
  const click = (p: PartId) => (e: React.MouseEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    onPartClick?.(p);
  };

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="180 0 720 1080"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Shorts */}
      <g onClick={click("shorts")} style={{ cursor: interactive ? "pointer" : "default" }}>
        <path d={SHORTS_D} fill={partColors.shorts} {...stroke} />
      </g>

      {/* Sleeves */}
      <g onClick={click("sleeves")} style={{ cursor: interactive ? "pointer" : "default" }}>
        <path d={G.sleeves} fill={partColors.sleeves} {...stroke} />
      </g>

      {/* Body */}
      <g onClick={click("body")} style={{ cursor: interactive ? "pointer" : "default" }}>
        <path d={G.body} fill={partColors.body} {...stroke} />
      </g>

      {/* Details (cuffs/side bands on front only) */}
      {view === "front" && (
        <g onClick={click("details")} style={{ cursor: interactive ? "pointer" : "default" }}>
          <rect x="693.2" y="710.5" width="42.9" height="163.1" transform="translate(-150.2 167.5) rotate(-12.1)" fill={partColors.details} {...stroke} />
          <rect x="343.9" y="710.5" width="42.9" height="163.1" transform="translate(556.4 1643.1) rotate(-167.9)" fill={partColors.details} {...stroke} />
          <rect x="274" y="214" width="42.9" height="112.4" transform="translate(63.2 -55.9) rotate(12.1)" fill={partColors.details} {...stroke} />
          <rect x="763.1" y="214" width="42.9" height="112.4" transform="translate(1608.4 369.7) rotate(167.9)" fill={partColors.details} {...stroke} />
        </g>
      )}

      {/* Collar */}
      <g onClick={click("collar")} style={{ cursor: interactive ? "pointer" : "default" }}>
        {G.collar.map((d, i) => (
          <path key={i} d={d} fill={partColors.collar} {...stroke} />
        ))}
      </g>

      {/* Stitching overlay */}
      <g pointerEvents="none">
        <path style={stitchStyle} d="M245,322s35.1,29.3,104.8,27.8" />
        <path style={stitchStyle} d="M243.2,326.6s35.1,29.3,104.8,27.8" />
        <path style={stitchStyle} d="M835,322s-35.1,29.3-104.8,27.8" />
        <path style={stitchStyle} d="M836.8,326.6s-35.1,29.3-104.8,27.8" />
        <path style={stitchStyle} d="M357.4,679.1s178.9,46.7,365.5,0" />
        <path style={stitchStyle} d="M310.1,982.6s76.6,48.6,199.9,19.2" />
        <path style={stitchStyle} d="M770,982.6s-76.6,48.6-199.9,19.2" />
      </g>

      {/* FRONT: chest number (left chest) + shorts number (right leg) */}
      {view === "front" && state.playerNumberFront.value && (
        <>
          <text
            x={440}
            y={281 + state.playerNumberFront.offsetY}
            fontFamily={state.playerNumberFront.font}
            fontSize={state.playerNumberFront.size}
            fill={state.playerNumberFront.color}
            textAnchor="middle"
            pointerEvents="none"
          >
            {state.playerNumberFront.value}
          </text>
          <text
            x={710}
            y={973}
            fontFamily={state.playerNumberFront.font}
            fontSize={60}
            fill={state.playerNumberFront.color}
            textAnchor="middle"
            pointerEvents="none"
          >
            {state.playerNumberFront.value}
          </text>
        </>
      )}

      {/* BACK: name + big number */}
      {view === "back" && (
        <>
          {state.playerName.value && (
            <text
              x={540}
              y={280 + state.playerName.offsetY}
              fontFamily={state.playerName.font}
              fontSize={state.playerName.size}
              fill={state.playerName.color}
              textAnchor="middle"
              pointerEvents="none"
              style={{ textTransform: "uppercase" }}
            >
              {state.playerName.value.toUpperCase()}
            </text>
          )}
          {state.playerNumberBack.value && (
            <text
              x={540}
              y={535 + state.playerNumberBack.offsetY}
              fontFamily={state.playerNumberBack.font}
              fontSize={state.playerNumberBack.size}
              fill={state.playerNumberBack.color}
              textAnchor="middle"
              pointerEvents="none"
            >
              {state.playerNumberBack.value}
            </text>
          )}
        </>
      )}

      {/* Chest badge (right chest, front only) */}
      {view === "front" && state.badgeChest.src && (
        <image
          href={state.badgeChest.src}
          x={state.badgeChest.x - state.badgeChest.size / 2}
          y={state.badgeChest.y - state.badgeChest.size / 2}
          width={state.badgeChest.size}
          height={state.badgeChest.size}
          pointerEvents="none"
        />
      )}
    </svg>
  );
});
KitSvg.displayName = "KitSvg";
