/** The BK-AI chip visual (the gateway's core), reused as the hub's centre. */
export function WorldCore({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`ai-lab-boot__core-wrap aw-corevis ${className}`}>
      <span className="ai-lab-boot__rig is-active">
        <span className="ai-lab-boot__ring ai-lab-boot__ring--a" />
        <span className="ai-lab-boot__ring ai-lab-boot__ring--b" />
        <span className="ai-lab-boot__ring ai-lab-boot__ring--c" />
        <span className="ai-lab-boot__orbit ai-lab-boot__orbit--a">
          <i className="ai-lab-boot__orbit-ring">
            <i className="ai-lab-boot__orb ai-lab-boot__orb--1" />
            <i className="ai-lab-boot__orb ai-lab-boot__orb--2" />
          </i>
        </span>
        <span className="ai-lab-boot__orbit ai-lab-boot__orbit--b">
          <i className="ai-lab-boot__orbit-ring">
            <i className="ai-lab-boot__orb ai-lab-boot__orb--3" />
            <i className="ai-lab-boot__orb ai-lab-boot__orb--4" />
          </i>
        </span>
        <span className="ai-lab-boot__chip">
          <span className="ai-lab-boot__die">
            <b>BK·AI</b>
            <i>CORE L0</i>
          </span>
        </span>
        <span className="ai-lab-boot__pulse" />
      </span>
    </div>
  );
}
