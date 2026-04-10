"use client";

import React, { useEffect, useRef } from "react";

const fragmentShaderSource = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
uniform vec3 u_color;
uniform vec3 u_bg;

#define FC gl_FragCoord.xy
#define R resolution
#define T (time+660.)

float rnd(vec2 p){p=fract(p*vec2(12.9898,78.233));p+=dot(p,p+34.56);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(rnd(i),rnd(i+vec2(1,0)),u.x),mix(rnd(i+vec2(0,1)),rnd(i+1.),u.x),u.y);}
float fbm(vec2 p){float t=.0,a=1.;for(int i=0;i<5;i++){t+=a*noise(p);p*=mat2(1,-1.2,.2,1.2)*2.;a*=.5;}return t;}

void main(){
  vec2 uv=(FC-.5*R)/R.y;
  vec3 col=vec3(1);
  uv.x+=.25;
  uv*=vec2(2,1);

  float n=fbm(uv*.28-vec2(T*.01,0));
  n=noise(uv*3.+n*2.);

  col.r-=fbm(uv+vec2(0,T*.015)+n);
  col.g-=fbm(uv*1.003+vec2(0,T*.015)+n+.003);
  col.b-=fbm(uv*1.006+vec2(0,T*.015)+n+.006);

  col=mix(col, u_color, dot(col,vec3(.21,.71,.07)));

  col=mix(u_bg,col,min(time*.1,1.));
  col=clamp(col,u_bg,vec3(1.));
  O=vec4(col,1);
}`;

type ProgramUniforms = WebGLProgram & {
	resolution: WebGLUniformLocation | null;
	time: WebGLUniformLocation | null;
	u_color: WebGLUniformLocation | null;
	u_bg: WebGLUniformLocation | null;
};

class Renderer {
	private readonly vertexSrc = `#version 300 es
precision highp float;
in vec4 position;
void main(){gl_Position=position;}`;
	private readonly vertices = [-1, 1, -1, -1, 1, 1, 1, -1];

	private gl: WebGL2RenderingContext;
	private canvas: HTMLCanvasElement;
	private program: WebGLProgram | null = null;
	private vs: WebGLShader | null = null;
	private fs: WebGLShader | null = null;
	private buffer: WebGLBuffer | null = null;
	private color: [number, number, number];
	private bg: [number, number, number];

	constructor(
		canvas: HTMLCanvasElement,
		fragmentSource: string,
		smokeRgb: [number, number, number],
		bgRgb: [number, number, number],
	) {
		this.canvas = canvas;
		this.color = smokeRgb;
		this.bg = bgRgb;
		const ctx = canvas.getContext("webgl2");
		if (!ctx) {
			throw new Error("WebGL2 is not available");
		}
		this.gl = ctx;
		this.setup(fragmentSource);
		this.init();
	}

	updateColor(newColor: [number, number, number]) {
		this.color = newColor;
	}

	updateBackground(newBg: [number, number, number]) {
		this.bg = newBg;
	}

	updateScale() {
		const dpr = Math.max(1, window.devicePixelRatio ?? 1);
		const width = this.canvas.clientWidth;
		const height = this.canvas.clientHeight;
		if (width < 1 || height < 1) return;
		this.canvas.width = Math.floor(width * dpr);
		this.canvas.height = Math.floor(height * dpr);
		this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
	}

	private compile(shader: WebGLShader, source: string) {
		const gl = this.gl;
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.error(`Shader compilation error: ${gl.getShaderInfoLog(shader)}`);
		}
	}

	reset() {
		const { gl, program, vs, fs } = this;
		if (!program) return;
		if (vs) {
			gl.detachShader(program, vs);
			gl.deleteShader(vs);
		}
		if (fs) {
			gl.detachShader(program, fs);
			gl.deleteShader(fs);
		}
		gl.deleteProgram(program);
		this.program = null;
	}

	private setup(fragmentSource: string) {
		const gl = this.gl;
		this.vs = gl.createShader(gl.VERTEX_SHADER);
		this.fs = gl.createShader(gl.FRAGMENT_SHADER);
		const program = gl.createProgram();
		if (!this.vs || !this.fs || !program) return;
		this.compile(this.vs, this.vertexSrc);
		this.compile(this.fs, fragmentSource);
		this.program = program;
		gl.attachShader(this.program, this.vs);
		gl.attachShader(this.program, this.fs);
		gl.linkProgram(this.program);
		if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
			console.error(`Program linking error: ${gl.getProgramInfoLog(this.program)}`);
		}
	}

	private init() {
		const { gl, program } = this;
		if (!program) return;
		this.buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
		const position = gl.getAttribLocation(program, "position");
		gl.enableVertexAttribArray(position);
		gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
		const p = program as ProgramUniforms;
		p.resolution = gl.getUniformLocation(program, "resolution");
		p.time = gl.getUniformLocation(program, "time");
		p.u_color = gl.getUniformLocation(program, "u_color");
		p.u_bg = gl.getUniformLocation(program, "u_bg");
	}

	render(now = 0) {
		const { gl, program, buffer, canvas } = this;
		if (!program || !gl.isProgram(program)) return;
		gl.clearColor(this.bg[0], this.bg[1], this.bg[2], 1);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.useProgram(program);
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		const p = program as ProgramUniforms;
		gl.uniform2f(p.resolution, canvas.width, canvas.height);
		gl.uniform1f(p.time, now * 1e-3);
		gl.uniform3fv(p.u_color, this.color);
		gl.uniform3fv(p.u_bg, this.bg);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}
}

const hexToRgb = (hex: string): [number, number, number] | null => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? [
				parseInt(result[1], 16) / 255,
				parseInt(result[2], 16) / 255,
				parseInt(result[3], 16) / 255,
			]
		: null;
};

export interface SmokeBackgroundProps {
	smokeColor?: string;
	/** Dark base; use same as hero (e.g. black) for a seamless blend */
	backgroundColor?: string;
	className?: string;
}

export const SmokeBackground: React.FC<SmokeBackgroundProps> = ({
	smokeColor = "#DC2626",
	backgroundColor = "#000000",
	className,
}) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const rendererRef = useRef<Renderer | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const smokeRgb =
			hexToRgb(smokeColor) ?? ([0.5, 0.5, 0.5] as [number, number, number]);
		const bgRgb =
			hexToRgb(backgroundColor) ?? ([0, 0, 0] as [number, number, number]);

		let renderer: Renderer;
		try {
			renderer = new Renderer(
				canvas,
				fragmentShaderSource,
				smokeRgb,
				bgRgb,
			);
		} catch {
			return;
		}
		rendererRef.current = renderer;

		const handleResize = () => renderer.updateScale();
		handleResize();

		window.addEventListener("resize", handleResize);
		const resizeObserver = new ResizeObserver(handleResize);
		resizeObserver.observe(canvas);

		let animationFrameId: number;
		const loop = (now: number) => {
			renderer.render(now);
			animationFrameId = requestAnimationFrame(loop);
		};
		loop(0);

		return () => {
			window.removeEventListener("resize", handleResize);
			resizeObserver.disconnect();
			cancelAnimationFrame(animationFrameId);
			renderer.reset();
			rendererRef.current = null;
		};
		// One-time WebGL setup; smokeColor / backgroundColor updates use their own effects.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		const renderer = rendererRef.current;
		if (!renderer) return;
		const rgbColor = hexToRgb(smokeColor);
		if (rgbColor) {
			renderer.updateColor(rgbColor);
		}
	}, [smokeColor]);

	useEffect(() => {
		const renderer = rendererRef.current;
		if (!renderer) return;
		const rgb = hexToRgb(backgroundColor);
		if (rgb) {
			renderer.updateBackground(rgb);
		}
	}, [backgroundColor]);

	return (
		<canvas
			ref={canvasRef}
			className={className ?? "block h-full w-full"}
		/>
	);
};
