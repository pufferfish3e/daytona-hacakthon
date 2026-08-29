type ObstaclesProps = {
  obstacleWidth: number;
  obstacleHeight: number;
  obstaclesLeft: number;
  gap: number;
  height: number;
};

export function Obstacles({
  obstacleWidth,
  obstacleHeight,
  obstaclesLeft,
  gap,
  height,
}: ObstaclesProps) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          backgroundColor: "black",
          width: obstacleWidth,
          height: height - obstacleHeight - gap,
          left: obstaclesLeft,
          bottom: 0 + obstacleHeight + gap,
        }}
      />
      <div
        style={{
          position: "absolute",
          backgroundColor: "black",
          width: obstacleWidth,
          height: obstacleHeight,
          left: obstaclesLeft,
          bottom: 0,
        }}
      />
    </>
  );
}
