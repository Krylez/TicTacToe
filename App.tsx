import React, {useEffect, useState}  from 'react';
import {
  Alert,
  Button,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

/**
 * Represents different types of game pieces that can occupy a spot on the game board.
 */
enum GamePiece {
  X,
  O,
  Empty
}

/**
 * Represents the current status of the game including the three different end game states.
 */
enum GameStatus {
  InProgress,
  Player1Winner,
  Player2Winner,
  CatsGame
}

enum PlayerType {
  Player1,
  Player2
}

type Player = {
  playerType: PlayerType;
  gamePiece: GamePiece;
  name: string;
}

type GridProps = {
  player: Player;
  playerTurn: PlayerType;
  gameGrid: GamePiece[];
  gameStatus: GameStatus;
  sendMove: (move: Move) => void;
}

type Move = {
  gamePiece: GamePiece;
  location: number;
}

/**
 * Sentinal value for no move. Used to avoid null and undefined.
 */
const NO_MOVE = {
  gamePiece: GamePiece.Empty,
  location: -1
}

// Game dimensions. Only tested with 3x3 game.
// Non-square game boards will definitely break on diagonals
const rows = 3;
const cols = 3;

/**
 * Represents the game board for a player. Each player should have their own game board.
 */
const Grid = (props: GridProps) => {
  const [myLastMove, setMyLastMove] = useState<Move>(NO_MOVE);
  const [currentTurn, setCurrentTurn] = useState(props.playerTurn);

  // Reset this local state when turn changes
  useEffect(() => {
    setCurrentTurn(props.playerTurn);
    setMyLastMove(NO_MOVE);
  }, [props.playerTurn]);

  const endGameText = function() {
    switch(props.gameStatus) {
      case GameStatus.CatsGame:
        return "Cat's Game 🐱";
      case GameStatus.Player1Winner:
        return props.player.playerType === PlayerType.Player1 ? "You Won 😊" : "You lost 😞";
      case GameStatus.Player2Winner:
        return props.player.playerType === PlayerType.Player2 ? "You Won 😊" : "You lost 😞";
      case GameStatus.InProgress:
      default:
        return "";
    }
  };

  const endTurn = function() {
    props.sendMove(myLastMove);
    setCurrentTurn(props.player.playerType === PlayerType.Player1 ? PlayerType.Player2 : PlayerType.Player1);
  }

  return (
    <View style={styles.gameBoard}>
      <Text style={styles.playerHeader}>{props.player.name}{props.playerTurn === props.player.playerType ? ", it's your turn" : ", waiting..."}</Text>
      <View style={styles.grid}>
        {props.gameGrid.map((gamePiece, index) => {

          // Set's background color according to player type (X is blue, O is red)
          // Use darker colors for player's current move
          const getBackgroundColor = function() {
            const isLastMove = myLastMove !== NO_MOVE && myLastMove.location === index;
            if (props.player.gamePiece === GamePiece.X) {
              return isLastMove ? '#0000cd' : '#6495ed';
            } else {
              return isLastMove ? '#dc143c' : '#cd5c5c';
            }
          }

          // Refer the game board state unless this is the location of the player's current move
          const currentGamePiece = myLastMove.location === index ? props.player.gamePiece : gamePiece
          // Only allow players to select empty spaces and only on their own turn
          const isSelectingDisabled = currentTurn !== props.player.playerType || props.gameGrid[index] !== GamePiece.Empty
          // Display X or O, but nothing for empty spaces
          const cellContents = currentGamePiece === GamePiece.Empty ? "" : GamePiece[currentGamePiece]

          return (
            <Pressable
              key={index}
              onPress={() => setMyLastMove(
                {
                  gamePiece: props.player.gamePiece,
                  location: index
                }
              )}
              style={[styles.cell, {backgroundColor: getBackgroundColor()}]}
              disabled={isSelectingDisabled}
              >
              <Text style={styles.cellLabel}>{cellContents}</Text>
            </Pressable>
          )
        })}
      </View>
      <Button
        onPress={endTurn}
        title="End My Turn"
        color={props.player.gamePiece === GamePiece.X ?  '#6495ed' : '#cd5c5c'}
        disabled={currentTurn !== props.player.playerType || myLastMove === NO_MOVE}
      />
      {
        props.gameStatus !== GameStatus.InProgress &&
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>{endGameText()}</Text>
          </View>
      }
    </View>
  );
};

function App(): JSX.Element {
  const [gameGrid, setGameGrid] = useState(Array(rows * cols).fill(GamePiece.Empty));
  const [playerTurn, setPlayerTurn] = useState(PlayerType.Player1);
  const [gameStatus, setGameStatus] = useState(GameStatus.InProgress);

  const player1 = {
    playerType: PlayerType.Player1,
    gamePiece: GamePiece.X,
    name: 'Player 1'
  };

  const player2 = {
    playerType: PlayerType.Player2,
    gamePiece: GamePiece.O,
    name: 'Player 2'
  };

  const resetGameSafe = function() {
    if (gameStatus !== GameStatus.InProgress) {
      resetGame();
    } else {
      Alert.alert('Restart?', 'Game is in progress. Are you sure?', [
        {text: 'Cancel', style: 'cancel'},
        {text: 'OK', onPress: resetGame},
      ]);
    }
  }

  const resetGame = function() {
    setGameGrid(Array(rows * cols).fill(GamePiece.Empty));
    setPlayerTurn(PlayerType.Player1);
    setGameStatus(GameStatus.InProgress)
  }

  const sendMove = function(move: Move) {
    setTimeout(() => {
      var currentPlayer = playerTurn
      // "Copy" the array to simulate getting it through an RPC response
      var gridCopy = JSON.parse(JSON.stringify(gameGrid)) as GamePiece[]
      gridCopy[move.location] = move.gamePiece
      setGameGrid(gridCopy)
      
      if (checkForWinner(gridCopy, move)) {
        if (currentPlayer === PlayerType.Player1) {
          setGameStatus(GameStatus.Player1Winner)
        }
        if (currentPlayer === PlayerType.Player2) {
          setGameStatus(GameStatus.Player2Winner)
        }
      } else if (checkForFullBoard(gridCopy)) {
        setGameStatus(GameStatus.CatsGame)
      }
      setPlayerTurn(currentPlayer === PlayerType.Player1 ? PlayerType.Player2 : PlayerType.Player1)
    }, 500);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Grid
          player={player1}
          playerTurn={playerTurn}
          gameGrid={gameGrid}
          gameStatus={gameStatus}
          sendMove={sendMove} />
        <View style={styles.gameSpacer}/>
        <Grid
          player={player2}
          playerTurn={playerTurn}
          gameGrid={gameGrid}
          gameStatus={gameStatus}
          sendMove={sendMove} />
        <View style={styles.footer}>
          <Button title="Reset The Game" onPress={resetGameSafe}/>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Used to check for whether the game has been won. This method only checks for matches that
 * include the last player movement. Because of this, the game board should be checked after
 * every move.
 * @param gameGrid a representation of the game board
 * @param lastPlay the last movement by a player
 * @returns true if the last move won the game
 */
function checkForWinner(gameGrid: GamePiece[], lastPlay: Move): boolean {
  // check current column
  var column = lastPlay.location % cols;
  var columnMatch = true;
  for (let i = 0; i < rows; i++) {
    if (gameGrid[i * cols + column] !== lastPlay.gamePiece) {
      columnMatch = false;
      break;
    }
  }
  if (columnMatch) {
    return true;
  }
  // check current row
  var row = Math.floor(lastPlay.location / cols) * cols;
  var rowMatch = true;
  for (let i = 0; i < cols; i++) {
    if (gameGrid[i + row] !== lastPlay.gamePiece) {
      rowMatch = false;
      break;
    }
  }
  if (rowMatch) {
    return true;
  }
  // check diag starting at top left
  var forwardDiag = true;
  for (let i = 0, j = 0; i < cols; i++, j++) {
    if (gameGrid[i + j * rows] !== lastPlay.gamePiece) {
      forwardDiag = false;
      break;
    }
  }
  if (forwardDiag) {
    return true;
  }
  // check diag starting at top right
  var backwardDiag = true;
  for (let i = 0, j = 0; i < cols; i++, j++) {
    if (gameGrid[cols -i -1 + j * rows] !== lastPlay.gamePiece) {
      backwardDiag = false;
      break;
    }
  }
  if (backwardDiag) {
    return true;
  }
  return false;
}

/**
 * Used to check whether the game board is full. If so, there are no more available moves.
 * @param gameGrid a representation of the game board
 * @returns true if the board is completely full
 */
function checkForFullBoard(gameGrid: GamePiece[]): boolean {
  for (const gamePiece of gameGrid) {
    if (gamePiece === GamePiece.Empty) {
      return false;
    }
  }
  return true;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#040404',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  overlay: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    height: '100%',
    width: '100%',
    backgroundColor: '#c0c0c0d0',
    zIndex: 1,
  },
  overlayText: {
    fontSize: 48,
    color: '#000',
  },
  cell: {
    flexBasis: '30%',
    flexGrow: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  cellLabel: {
    fontSize: 54,
  },
  playerHeader: {
    fontSize: 32,
  },
  gameSpacer: {
    height: 40,
  },
  gameBoard: {
    margin: 10,
  },
  footer: {
    marginTop: 40,
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 10,
  },
});

export default App;
