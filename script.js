/**
 * CubzAI Scripts
 * FIXED: Galaxy Footer Visibility & Preloader
 */

// --- 1. GALAXY EFFECT (Vanilla JS + OGL) ---
function initGalaxyFooter() {
    const container = document.getElementById('galaxy-footer');
    if (!container) return;

    // SAFETY CHECK: Ensure OGL is loaded
    if (!window.ogl) {
        console.warn("OGL library not loaded. Galaxy effect skipped.");
        return;
    }

    const { Renderer, Program, Mesh, Triangle, Color } = window.ogl;

    const renderer = new Renderer({ alpha: true, premultipliedAlpha: false });
    const gl = renderer.gl;

    // Clear settings
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    container.innerHTML = ''; // Clear any existing canvas
    container.appendChild(gl.canvas);

    // Vertex Shader
    const vertex = `
        attribute vec2 uv;
        attribute vec2 position;
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = vec4(position, 0, 1);
        }
    `;

    // Fragment Shader
    const fragment = `
        precision highp float;
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec2 uMouse;
        varying vec2 vUv;

        float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }

        void main() {
            vec2 st = gl_FragCoord.xy / uResolution.xy;
            st.x *= uResolution.x / uResolution.y;

            vec3 color = vec3(0.0);
            float t = uTime * 0.2;

            // Simple Starfield
            for(float i=0.0; i<3.0; i++){
                vec2 grid = st * (10.0 + i * 5.0);
                grid += vec2(t * (0.5 + i * 0.2), t * (0.2 + i * 0.1));

                vec2 ipos = floor(grid);
                vec2 fpos = fract(grid);

                float star = random(ipos + i);
                if(star > 0.98) {
                    float brightness = smoothstep(0.98, 1.0, star);
                    // Twinkle
                    float twinkle = sin(t * 5.0 + star * 100.0) * 0.5 + 0.5;
                    color += vec3(brightness * twinkle);
                }
            }

            // Mouse Interaction Glow
            vec2 mouseNorm = uMouse;
            mouseNorm.x *= uResolution.x / uResolution.y;
            float dist = distance(st, mouseNorm);
            color += vec3(0.2, 0.4, 1.0) * smoothstep(0.4, 0.0, dist) * 0.3;

            gl_FragColor = vec4(color, 1.0);
        }
    `;

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
        vertex,
        fragment,
        uniforms: {
            uTime: { value: 0 },
            uResolution: { value: new Float32Array([gl.canvas.width, gl.canvas.height]) },
            uMouse: { value: new Float32Array([0.5, 0.5]) }
        }
    });

    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
        const width = container.offsetWidth;
        const height = container.offsetHeight;
        renderer.setSize(width, height);
        program.uniforms.uResolution.value = new Float32Array([width, height]);
    }

    window.addEventListener('resize', resize);
    resize(); // Force initial size

    // Mouse tracking relative to footer
    const mouse = { x: 0.5, y: 0.5 };
    window.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
            const x = (e.clientX - rect.left) / rect.width;
            const y = 1.0 - (e.clientY - rect.top) / rect.height; // Flip Y for shader
            mouse.x = x * (rect.width / rect.height); // Adjust aspect for shader logic if needed
            mouse.y = y; // Raw 0-1 often better for simple shaders, but here matching shader logic

            // Passing raw normalized coords is safer for general shaders:
            program.uniforms.uMouse.value[0] = (e.clientX - rect.left) / rect.width * (rect.width / rect.height);
            program.uniforms.uMouse.value[1] = 1.0 - (e.clientY - rect.top) / rect.height;
        }
    });

    function update(t) {
        requestAnimationFrame(update);
        program.uniforms.uTime.value = t * 0.001;
        renderer.render({ scene: mesh });
    }
    requestAnimationFrame(update);
}

// --- MAIN INIT ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Preloader
    const preloader = document.querySelector('.preloader');
    const bar = document.querySelector('.loader-progress');
    const percent = document.querySelector('.loader-percent');
    let load = 0;
    const int = setInterval(() => {
        load += 5;
        if (load > 100) load = 100;
        if (bar) bar.style.width = `${load}%`;
        if (percent) percent.innerText = `${load}%`;
        if (load === 100) {
            clearInterval(int);
            setTimeout(() => preloader?.classList.add('hide'), 500);
        }
    }, 50);

    // 2. Galaxy Footer
    try { initGalaxyFooter(); } catch (e) { console.error(e); }
    // 3. Custom Cursor
    const dot = document.getElementById('cursor-dot');
    const outline = document.getElementById('cursor-outline');
    window.addEventListener('mousemove', (e) => {
        const x = e.clientX;
        const y = e.clientY;
        requestAnimationFrame(() => {
            if (dot) dot.style.transform = `translate(${x}px, ${y}px)`;
            if (outline) outline.animate({ transform: `translate(${x}px, ${y}px)` }, { duration: 500, fill: "forwards" });
        });
    });

    // 4. Nav Pill
    const navLinks = document.querySelectorAll('.nav-link');
    const pill = document.querySelector('.nav-active-pill');
    const navContainer = document.querySelector('.nav-links');
    if (pill && navContainer) {
        navLinks.forEach(link => {
            link.addEventListener('mouseenter', (e) => {
                const r = e.target.getBoundingClientRect();
                const c = navContainer.getBoundingClientRect();
                pill.style.width = `${r.width}px`;
                pill.style.transform = `translateX(${r.left - c.left}px)`;
                pill.style.opacity = '1';
            });
        });
        navContainer.addEventListener('mouseleave', () => pill.style.opacity = '0');
    }

    // 5. Founder Toggle
    window.toggleFounder = function (card) {
        document.querySelectorAll('.founder-card').forEach(c => {
            if (c !== card) c.classList.remove('active');
        });
        card.classList.toggle('active');
    };

    // 6. Lenis Smooth Scroll
    if (typeof Lenis !== 'undefined') {
        const lenis = new Lenis();
        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
    }

    // 7. Modal Interactions
    const modal = document.getElementById('waitlist-modal');
    const btns = document.querySelectorAll('[data-modal-open]');
    const close = document.querySelector('.close-modal');
    btns.forEach(b => b.addEventListener('click', () => modal.classList.add('active')));
    if (close) close.addEventListener('click', () => modal.classList.remove('active'));
    window.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
});
