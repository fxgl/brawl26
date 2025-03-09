import { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Button, Group, Text, Stack } from '@mantine/core';
import { useUserProfileStore } from "../store/userProfileStore";
import { DataPacket, GameState, MessageType } from "../../../../shared/datapacket.ts";
import {useAppStore} from "../store/appStore.ts";
import {peerService} from "../utils/peerService.ts";

// Game constants
const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 15;
const BALL_SIZE = 15;
const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;
const PADDLE_SPEED = 8;
const INITIAL_BALL_SPEED = 5;


// Input data to exchange between peers
interface PongInputData {
  paddleY: number;
  timestamp: number;
}

export function PongGame() {
  const remotePeerId = useAppStore(state => state.remotePeerId);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const profile = useUserProfileStore(state => state.profile);
  const [isHost,setIsHost] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    leftPaddleY: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    rightPaddleY: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    ballX: GAME_WIDTH / 2,
    ballY: GAME_HEIGHT / 2,
    ballSpeedX: INITIAL_BALL_SPEED,
    ballSpeedY: INITIAL_BALL_SPEED / 2,
    leftScore: 0,
    rightScore: 0,
    gameStarted: false,
    gameOver: false,
    winner: null
  });
  
  const [keysPressed, setKeysPressed] = useState<{ [key: string]: boolean }>({});
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());

  // Handle receiving game data from peer
  const onData = useCallback((_peerId: string, data: DataPacket) => {
   // console.log(`Received game data from ${_peerId}:`, data);
    if (data.type === MessageType.GAME_INPUT && data.gameInput) {
      const inputData = data.gameInput.data as PongInputData;

      setGameState(prevState => {
        // Update opponent's paddle position
        if (isHost) {
          return { ...prevState, rightPaddleY: inputData.paddleY+prevState.rightPaddleY };
        } else {
          return { ...prevState, leftPaddleY: inputData.paddleY+prevState.leftPaddleY };
        }
      });
     }
     else if (data.type === MessageType.GAME_STATE && data.gameState) {
       // Sync full game state from host
       setGameState(prevState => ({
         ...prevState,
         ...(data.gameState?.state as Partial<GameState> || {})
      }));
    } else if (data.type === MessageType.GAME_START && data.gameStart) {
      setGameState(prevState => ({
        ...prevState,
        gameStarted: true,
        ballSpeedX: data.gameStart?.initialDirection === 'left' ? -INITIAL_BALL_SPEED : INITIAL_BALL_SPEED,
        ballSpeedY: (Math.random() * 2 - 1) * INITIAL_BALL_SPEED
      }));
    }
  }, [isHost]);

  useEffect(() => {
    // Add the data handler
    peerService.addDataHandler(onData);

    // Clean up when component unmounts
    return () => {
      peerService.removeDataHandler();
    };
  }, [onData]);
  const send = useCallback((peer:string,packet:DataPacket)=>
  {
    peerService.send(peer, packet);
  },[])



  // Determine if this client is the host (left paddle)
  useEffect(() => {
    if (profile && remotePeerId) {
      // Simple way to determine host: lexicographically compare peer IDs
      setIsHost( profile.id < remotePeerId);

    }
  }, [profile, remotePeerId]);

  // Send paddle position to peer
  const sendPaddlePosition = useCallback((paddleY: number) => {
    if (!remotePeerId) return;
    
    const inputData: PongInputData = {
      paddleY,
      timestamp: Date.now()
    };
    
    const packet: DataPacket = {
      type: MessageType.GAME_INPUT,
      gameInput: {
        data: inputData
      }
    };
    //console.log(`Sending ${JSON.stringify( packet)}`)
    
    send(remotePeerId, packet);
  }, [remotePeerId, send]);

  // Start the game
  const startGame = useCallback(() => {
    if (!isHost || !remotePeerId) return;
    
    // Reset game state
    setGameState(prev => ({
      ...prev,
      ballX: GAME_WIDTH / 2,
      ballY: GAME_HEIGHT / 2,
      leftScore: 0,
      rightScore: 0,
      gameStarted: true,
      gameOver: false,
      winner: null
    }));
    
    // Send start game message
    const initialDirection = Math.random() > 0.5 ? 'left' : 'right';
    const packet: DataPacket = {
      type: MessageType.GAME_START,
      gameStart: {
        initialDirection
      }
    };
    
    send(remotePeerId, packet);
    
    // Set initial ball direction for host
    setGameState(prev => ({
      ...prev,
      ballSpeedX: initialDirection === 'left' ? -INITIAL_BALL_SPEED : INITIAL_BALL_SPEED,
      ballSpeedY: (Math.random() * 2 - 1) * INITIAL_BALL_SPEED
    }));
  }, [isHost, remotePeerId, send]);

  // Game loop
  useEffect(() => {
    if (!gameState.gameStarted || gameState.gameOver) return;
    
    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = (now - lastUpdateTimeRef.current) / 16.67; // Normalize to ~60fps
      lastUpdateTimeRef.current = now;
      
      setGameState(prevState => {
        // Don't update if game is not started or is over
        if (!prevState.gameStarted || prevState.gameOver) return prevState;
        
        let { 
          leftPaddleY, rightPaddleY, ballX, ballY, 
          ballSpeedX, ballSpeedY, leftScore, rightScore 
        } = prevState;
        
        // Update paddle position based on key presses
        if (isHost) {
          // Host controls left paddle

          let newPos = leftPaddleY;
          if (keysPressed.ArrowUp) newPos = Math.max(0, leftPaddleY - PADDLE_SPEED * deltaTime);
          if (keysPressed.ArrowDown) newPos = Math.min(GAME_HEIGHT - PADDLE_HEIGHT, leftPaddleY + PADDLE_SPEED * deltaTime);
          
          // Send paddle position to peer
          sendPaddlePosition(newPos-leftPaddleY);
          leftPaddleY= newPos;
        } else {
          let newPos = rightPaddleY;
          // Client controls right paddle
          if (keysPressed.ArrowUp) newPos = Math.max(0, rightPaddleY - PADDLE_SPEED * deltaTime);
          if (keysPressed.ArrowDown) newPos = Math.min(GAME_HEIGHT - PADDLE_HEIGHT, rightPaddleY + PADDLE_SPEED * deltaTime);
          
          // Send paddle position to peer
          sendPaddlePosition(newPos-rightPaddleY);
          rightPaddleY= newPos;
        }

        // Only host updates ball position to avoid desync
        if (isHost) {
          // Update ball position
          ballX += ballSpeedX * deltaTime;
          ballY += ballSpeedY * deltaTime;

          // Ball collision with top and bottom walls
          if (ballY <= 0 || ballY >= GAME_HEIGHT - BALL_SIZE) {
            ballSpeedY = -ballSpeedY;
          }

          // Ball collision with paddles
          if (
              ballX <= PADDLE_WIDTH &&
              ballY + BALL_SIZE >= leftPaddleY &&
              ballY <= leftPaddleY + PADDLE_HEIGHT
          ) {
            ballSpeedX = Math.abs(ballSpeedX) * 1.05; // Increase speed slightly
            // Angle based on where ball hits paddle
            const hitPosition = (ballY - leftPaddleY) / PADDLE_HEIGHT;
            ballSpeedY = (hitPosition - 0.5) * 2 * INITIAL_BALL_SPEED;
          }

          if (
              ballX >= GAME_WIDTH - PADDLE_WIDTH - BALL_SIZE &&
              ballY + BALL_SIZE >= rightPaddleY &&
              ballY <= rightPaddleY + PADDLE_HEIGHT
          ) {
            ballSpeedX = -Math.abs(ballSpeedX) * 1.05; // Increase speed slightly
            // Angle based on where ball hits paddle
            const hitPosition = (ballY - rightPaddleY) / PADDLE_HEIGHT;
            ballSpeedY = (hitPosition - 0.5) * 2 * INITIAL_BALL_SPEED;
          }

          // Score points
          let gameOver = !!prevState.gameOver;
          let winner = prevState.winner;

          if (ballX <= 0) {
            rightScore += 1;
            ballX = GAME_WIDTH / 2;
            ballY = GAME_HEIGHT / 2;
            ballSpeedX = INITIAL_BALL_SPEED;
            ballSpeedY = (Math.random() * 2 - 1) * INITIAL_BALL_SPEED;

            if (rightScore >= 5) {
              gameOver = true;
              winner = "Right";
            }
          }

          if (ballX >= GAME_WIDTH - BALL_SIZE) {
            leftScore += 1;
            ballX = GAME_WIDTH / 2;
            ballY = GAME_HEIGHT / 2;
            ballSpeedX = -INITIAL_BALL_SPEED;
            ballSpeedY = (Math.random() * 2 - 1) * INITIAL_BALL_SPEED;

            if (leftScore >= 5) {
              gameOver = true;
              winner = "Left";
            }

          }

          // Send game state to peer
          if (isHost) {
            const statePacket: DataPacket = {
              type: MessageType.GAME_STATE,
              gameState: {
                state: {
                  leftPaddleY,
                  rightPaddleY,
                  ballX,
                  ballY,
                  ballSpeedX,
                  ballSpeedY,
                  leftScore,
                  rightScore,
                  gameStarted: prevState.gameStarted,
                  gameOver,
                  winner
                }
              }
            };
            send(remotePeerId, statePacket);
          }

          return {
            ...prevState,
            leftPaddleY,
            rightPaddleY,
            ballX,
            ballY,
            ballSpeedX,
            ballSpeedY,
            leftScore,
            rightScore,
            gameOver,
            winner
          };
        }
        
        return {
          ...prevState,
          leftPaddleY,
          rightPaddleY
        };
      });

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState.gameStarted, gameState.gameOver, keysPressed, remotePeerId, send, sendPaddlePosition]);


  // Draw game on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw center line
    ctx.strokeStyle = '#fff';
    ctx.setLineDash([5, 15]);
    ctx.beginPath();
    ctx.moveTo(GAME_WIDTH / 2, 0);
    ctx.lineTo(GAME_WIDTH / 2, GAME_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, gameState.leftPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.fillRect(GAME_WIDTH - PADDLE_WIDTH, gameState.rightPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Draw ball
    ctx.fillRect(gameState.ballX, gameState.ballY, BALL_SIZE, BALL_SIZE);

    // Draw scores
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(gameState.leftScore.toString(), GAME_WIDTH / 4, 50);
    ctx.fillText(gameState.rightScore.toString(), GAME_WIDTH * 3 / 4, 50);

    // Draw player indicators
    ctx.font = '16px Arial';
    ctx.fillText(isHost ? 'You' : 'Opponent', GAME_WIDTH / 4, 80);
    ctx.fillText(isHost ? 'Opponent' : 'You', GAME_WIDTH * 3 / 4, 80);

  }, [gameState]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        setKeysPressed(prev => ({ ...prev, [e.key]: true }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        setKeysPressed(prev => ({ ...prev, [e.key]: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <Stack align="center" >
      <Text size="xl" w={700}>Pong Game peer:{remotePeerId}</Text>

      {gameState.gameOver ? (
        <Box>
          <Text size="lg" mb="md">
            Game Over! {gameState.winner === 'Left' ?
              (isHost ? 'You' : 'Opponent') :
              (isHost ? 'Opponent' : 'You')} wins!
          </Text>
          {isHost && (
            <Button onClick={startGame} color="blue">
              Play Again
            </Button>
          )}
        </Box>
      ) : !gameState.gameStarted ? (
        <Box>
          <Text size="md" mb="md">
            {isHost ?
              'You are the host. Click Start Game to begin.' :
              'Waiting for host to start the game...'}
          </Text>
          {isHost && (
            <Button onClick={startGame} color="green">
              Start Game
            </Button>
          )}
        </Box>
      ) : (
        <Text size="md">Use ↑ and ↓ arrow keys to move your paddle</Text>
      )}

      <Box
          style={{
            border: '2px solid white',
            borderRadius: '4px',
            overflow: 'hidden'
          }}
      >
        <canvas
            ref={canvasRef}
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            style={{ display: 'block' }}
        />
      </Box>

      <Group justify="space-between" style={{ width: GAME_WIDTH }}>
        <Text>Score: {isHost ? gameState.leftScore : gameState.rightScore}</Text>
        <Text>Opponent: {isHost ? gameState.rightScore : gameState.leftScore}</Text>
      </Group>
    </Stack>
  );
}
