const particles = [
  // Circles - pitch-green
  { size: 8, x: "5%", y: "15%", color: "#58CC02" },
  { size: 12, x: "15%", y: "70%", color: "#58CC02" },
  { size: 6, x: "85%", y: "25%", color: "#58CC02" },
  { size: 10, x: "92%", y: "60%", color: "#58CC02" },
  { size: 7, x: "45%", y: "10%", color: "#58CC02" },

  // Circles - teal
  { size: 9, x: "25%", y: "40%", color: "#4ECDC4" },
  { size: 11, x: "70%", y: "80%", color: "#4ECDC4" },
  { size: 6, x: "60%", y: "20%", color: "#4ECDC4" },
  { size: 8, x: "10%", y: "85%", color: "#4ECDC4" },

  // Circles - card-yellow
  { size: 10, x: "80%", y: "45%", color: "#FACC15" },
  { size: 7, x: "35%", y: "75%", color: "#FACC15" },
  { size: 9, x: "55%", y: "55%", color: "#FACC15" },
  { size: 6, x: "20%", y: "30%", color: "#FACC15" },

  // Additional particles for density
  { size: 5, x: "40%", y: "90%", color: "#58CC02" },
  { size: 8, x: "75%", y: "15%", color: "#4ECDC4" },
  { size: 7, x: "95%", y: "85%", color: "#FACC15" },
  { size: 6, x: "8%", y: "50%", color: "#58CC02" },
];

export function GeometricParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-drift"
          style={{
            width: p.size,
            height: p.size,
            left: p.x,
            top: p.y,
            backgroundColor: p.color,
            opacity: 0.15,
            animationDelay: `${i * 0.8}s`,
            animationDuration: `${15 + i * 2}s`,
          }}
        />
      ))}
    </div>
  );
}
