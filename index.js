class Agent{
    constructor(){}

    /**
      * Must return a JSON object representing the row and column to put a piece
      *   {'x':column, 'y':row}
      * Receives a JSON object with the perception information
      * {
      *  'color': Color of the pieces the player is playing with 
      *  'board': A matrix with the current position of the board:
      *            ' ': Represents empty cell
      *            'W': Represents a cell with a white piece
      *            'B': Represents a cell with a black piece
      *  'W': Remaining time of the white pieces
      *  'B': Remaining time of the black pieces
      * }
      */
    compute( percept ){ return {'x':0, 'y':0} }
}

/**
  * Player's Code (Must inherit from Agent)
  * This is an example of a rangom player agent
  */
class RandomAgent extends Agent{
    constructor(){
        super()
    }

    compute(percept){
        var color = percept['color'] // Gets player's color
        var wtime = percept['W'] // Gets remaining time of whites color player
        var btime = percept['B'] // Gets remaining time of blacks color player
        var board = percept['board'] // Gets the current board's position
        var moves = board.valid_moves(color)
        var index = Math.floor(moves.length * Math.random())
        for(var i=0; i<50000000; i++){} // Making it very slow to test time restriction
        return moves[index]
    }
}


class Grupo3Agent extends Agent{
    constructor(){
        super()
            this.positionWeights = null 
    }

    // Genera la matriz de pesos dinámicamente según el tamaño del tablero
    generatePositionWeights(size){

        var weights = []
        
        for(var i = 0; i < size; i++){
            weights[i] = []
            for(var j = 0; j < size; j++){
                var weight = 0
                
                // Esquinas: máximo valor (100)
                if((i === 0 && j === 0) || (i === 0 && j === size-1) || 
                   (i === size-1 && j === 0) || (i === size-1 && j === size-1)){
                    weight = 100
                }
                // Posiciones adyacentes a esquinas: muy negativo
                else if(this.isAdjacentToCorner(i, j, size)){
                    weight = -50
                }
                // Bordes (sin esquinas ni adyacentes a esquinas): positivo
                else if(i === 0 || i === size-1 || j === 0 || j === size-1){
                    weight = 10
                }
                // Segunda fila/columna desde el borde: ligeramente negativo
                else if(i === 1 || i === size-2 || j === 1 || j === size-2){
                    weight = -2
                }
                // Centro del tablero: neutral a ligeramente negativo
                else {
                    var distanceFromCenter = Math.min(
                        Math.abs(i - size/2), 
                        Math.abs(j - size/2)
                    )
                    weight = -1 + distanceFromCenter * 0.5
                }
                
                weights[i][j] = weight
            }
        }
        console.log("Generated position weights for size " + size + ": ", weights)
        return weights
    }

    // Verifica si una posición es adyacente a una esquina
    isAdjacentToCorner(row, col, size){
        var corners = [
            [0, 0], [0, size-1], [size-1, 0], [size-1, size-1]
        ]
        
        for(var k = 0; k < corners.length; k++){
            var corner = corners[k]
            var deltaRow = Math.abs(row - corner[0])
            var deltaCol = Math.abs(col - corner[1])
            
            // Si está a distancia 1 de una esquina (pero no es la esquina misma)
            if(deltaRow <= 1 && deltaCol <= 1 && (deltaRow + deltaCol > 0)){
                return true
            }
        }
        
        return false
    }

    compute(percept){
        var color = percept['color']
        var board = percept['board']
        var moves = board.valid_moves(color)
        
        if(moves.length === 0) return null
        if(moves.length === 1) return moves[0]
        
        // Generar pesos dinámicos según el tamaño del tablero
        var size = board.board.length
        
        if(this.positionWeights === null || this.positionWeights.length !== size){
            this.positionWeights = this.generatePositionWeights(size)
        }
        
        // Usar minimax con profundidad adaptativa según el tiempo disponible
        var myTime = color === 'W' ? percept['W'] : percept['B']
        var depth = myTime > 30000 ? 4 : (myTime > 10000 ? 3 : 2)
        
        var bestMove = this.minimax(board, color, depth, true, -Infinity, Infinity).move
        return bestMove || moves[0]
    }

    
    minimax(board, color, depth, isMaximizing, alpha, beta){
        var moves = board.valid_moves(color)
        var opponent = color === 'W' ? 'B' : 'W'
        
        
        if(depth === 0 || moves.length === 0){
            return {
                score: this.evaluateBoard(board, color),
                move: null
            }
        }
        
        var bestMove = moves[0]
        
        if(isMaximizing){
            var maxScore = -Infinity
            
            for(var i = 0; i < moves.length; i++){
                var move = moves[i]
                var newBoard = board.clone()
                
                if(newBoard.move(move.x, move.y, color)){
                    var result = this.minimax(newBoard, opponent, depth - 1, false, alpha, beta)
                    
                    if(result.score > maxScore){
                        maxScore = result.score
                        bestMove = move
                    }
                    
                    alpha = Math.max(alpha, result.score)
                    if(beta <= alpha) break // Poda alfa-beta
                }
            }
            
            return { score: maxScore, move: bestMove }
        } else {
            var minScore = Infinity
            
            for(var i = 0; i < moves.length; i++){
                var move = moves[i]
                var newBoard = board.clone()
                
                if(newBoard.move(move.x, move.y, opponent)){
                    var result = this.minimax(newBoard, color, depth - 1, true, alpha, beta)
                    
                    if(result.score < minScore){
                        minScore = result.score
                        bestMove = move
                    }
                    
                    beta = Math.min(beta, result.score)
                    if(beta <= alpha) break // Poda alfa-beta
                }
            }
            
            return { score: minScore, move: bestMove }
        }
    }

    
    evaluateBoard(board, color){
        var myColor = color
        var opponentColor = color === 'W' ? 'B' : 'W'
        var size = board.board.length
        var score = 0
        
        var myPieces = 0
        var opponentPieces = 0
        var myMobility = board.valid_moves(myColor).length
        var opponentMobility = board.valid_moves(opponentColor).length
        
        
        for(var i = 0; i < size; i++){
            for(var j = 0; j < size; j++){
                var piece = board.board[i][j]
                
                if(piece === myColor){
                    myPieces++
                    // Bonus por posiciones estratégicas
                    if(i < this.positionWeights.length && j < this.positionWeights[i].length){
                        score += this.positionWeights[i][j]
                    }
                } else if(piece === opponentColor){
                    opponentPieces++
                    // Penalización por posiciones estratégicas del oponente
                    if(i < this.positionWeights.length && j < this.positionWeights[i].length){
                        score -= this.positionWeights[i][j]
                    }
                }
            }
        }
        
        // Factores de evaluación:
        
        // 1. Control de esquinas (muy importante)
        var cornerBonus = this.evaluateCorners(board, myColor, opponentColor)
        score += cornerBonus * 25
        
        // 2. Movilidad (capacidad de movimiento)
        if(myMobility + opponentMobility > 0){
            score += (myMobility - opponentMobility) * 10
        }
        
        // 3. Estabilidad de piezas
        var stability = this.evaluateStability(board, myColor, opponentColor)
        score += stability * 5
        
        // 4. Diferencia de piezas (menos importante al principio)
        var totalPieces = myPieces + opponentPieces
        var pieceRatio = totalPieces / (size * size)
        
        if(pieceRatio > 0.7){ // En el final del juego, las piezas importan más
            score += (myPieces - opponentPieces) * 2
        }
        
        return score
    }

    // Evaluar control de esquinas
    evaluateCorners(board, myColor, opponentColor){
        var size = board.board.length
        var corners = [[0,0], [0,size-1], [size-1,0], [size-1,size-1]]
        var myCorners = 0
        var opponentCorners = 0
        
        for(var i = 0; i < corners.length; i++){
            var corner = corners[i]
            var piece = board.board[corner[0]][corner[1]]
            
            if(piece === myColor) myCorners++
            else if(piece === opponentColor) opponentCorners++
        }
        
        return myCorners - opponentCorners
    }

    // Evaluar estabilidad de las piezas
    evaluateStability(board, myColor, opponentColor){
        var size = board.board.length
        var myStable = 0
        var opponentStable = 0
        
        // Las esquinas son siempre estables 
        var corners = [[0,0], [0,size-1], [size-1,0], [size-1,size-1]]
        
        for(var i = 0; i < corners.length; i++){
            var corner = corners[i]
            var piece = board.board[corner[0]][corner[1]]
            
            if(piece === myColor) myStable++
            else if(piece === opponentColor) opponentStable++
        }
        
        // Los bordes con piezas del mismo color son más estables
        for(var i = 0; i < size; i++){
            // Borde superior e inferior
            if(board.board[0][i] === myColor) myStable += 0.5
            else if(board.board[0][i] === opponentColor) opponentStable += 0.5
            
            if(board.board[size-1][i] === myColor) myStable += 0.5
            else if(board.board[size-1][i] === opponentColor) opponentStable += 0.5
            
            // Borde izquierdo y derecho
            if(board.board[i][0] === myColor) myStable += 0.5
            else if(board.board[i][0] === opponentColor) opponentStable += 0.5
            
            if(board.board[i][size-1] === myColor) myStable += 0.5
            else if(board.board[i][size-1] === opponentColor) opponentStable += 0.5
        }
        
        return myStable - opponentStable
    }
}

/////////////////// ENVIRONMENT CLASSES AND DEFINITION /////////////////////////
/*
* Board class (Cannot be modified )
*/
class Board{
    /**
     * Creates a board of size*size 
     * @param {*} size Size of the board
     */
    constructor(size){
        var board = []
        for(var i=0; i<size; i++){
            board[i] = []
            for(var j=0; j<size; j++)
                board[i][j] = ' '
        }
        var m = Math.floor(size/2) - 1
        board[m][m] = 'W'
        board[m][m+1] = 'B'
        board[m+1][m+1] = 'W'
        board[m+1][m] = 'B'
        this.board = board
    }

    // Deep clone of a board the reduce risk of damaging the real board
    clone(){
        var board = this.board
        var size = board.length
        var b = []
        for(var i=0; i<size; i++){
            b[i] = []
            for(var j=0; j<size; j++)
                b[i][j] = board[i][j]
        }
        var nb = new Board(2)
        nb.board = b
        return nb
    }

    // Determines if a piece of the given color can be set at position  y, x (row, column, respectively)
    check(color, x, y){
        var board = this.board
        var size = board.length
        if(board[y][x]!=' ') return false
        var rcolor = color=='W'?'B':'W'
        //left
        var k=x-1
        while(k>=0 && board[y][k]==rcolor) k--
        if(k>=0 && Math.abs(k-x)>1 && board[y][k]==color) return true
        //right
        k=x+1
        while(k<size && board[y][k]==rcolor) k++
        if(k<size && Math.abs(k-x)>1 && board[y][k]==color) return true
        //up
        k=y-1
        while(k>=0 && board[k][x]==rcolor) k--
        if(k>=0 && Math.abs(k-y)>1 && board[k][x]==color) return true
        //down
        k=y+1
        while(k<size && board[k][x]==rcolor) k++
        if(k<size && Math.abs(k-y)>1 && board[k][x]==color) return true
        //left-top
        k=y-1
        var l=x-1
        while(k>=0 && l>=0 && board[k][l]==rcolor){
            k--
            l--
        }
        if(k>=0 && l>=0 && Math.abs(k-y)>1 && Math.abs(l-x)>1 && board[k][l]==color) return true
        //left-bottom
        k=y+1
        l=x-1
        while(k<size && l>=0 && board[k][l]==rcolor){
            k++
            l--
        }
        if(k<size && l>=0 && Math.abs(k-y)>1 && Math.abs(l-x)>1 && board[k][l]==color) return true
        //right-top
        k=y-1
        l=x+1
        while(k>=0 && l<size && board[k][l]==rcolor){
            k--
            l++
        }
        if(k>=0 && l<size && Math.abs(k-y)>1 && Math.abs(l-x)>1 && board[k][l]==color) return true
        //right-bottom
        k=y+1
        l=x+1
        while(k<size && l<size && board[k][l]==rcolor){
            k++
            l++
        }
        if(k<size && l<size && Math.abs(k-y)>1 && Math.abs(l-x)>1 && board[k][l]==color) return true
        return false
    }

    // Computes all the valid moves for the given 'color'
    valid_moves(color){
        var moves = []
        var size = this.board.length
        for(var i=0; i<size; i++){
            for( var j=0; j<size; j++)
            if(this.check(color, j, i)) moves.push({'y':i, 'x':j})
        }
        return moves
    }

    // Determines if a piece of 'color' can be set
    can_play(color){
        var board = this.board
        var size = board.length
        var i=0
        while(i<size){
            var j=0
            while(j<size && !this.check(color, j, i)) j++
            if(j<size) return true
            i++
        }
        return false
    }

    // Computes the new board when a piece of 'color' is set at position y, x (row, column respectively)
    // If it is an invalid movement stops the game and declares the other 'color' as winner
    move(x, y, color){
        var board = this.board
        var size = board.length
        if(x<0 || x>=size || y<0 || y>=size || board[y][x]!=' ') return false
        board[y][x] = color
        var rcolor = color=='W'?'B':'W'
        var flag = false
        var i = y
        var j = x
        //left
        var k=j-1
        while(k>=0 && board[i][k]==rcolor) k--
        if(k>=0 && Math.abs(k-j)>1 && board[i][k]==color){
            flag = true
            k=j-1
            while(k>0 && board[i][k]==rcolor){
                board[i][k]=color
                k--
            }
        }
        //right
        k=j+1
        while(k<size && board[i][k]==rcolor) k++
        if(k<size && Math.abs(k-j)>1 && board[i][k]==color){
            flag = true
            k=j+1
            while(k<size && board[i][k]==rcolor){
                board[i][k]=color
                k++
            }
        }
        //up
        k=i-1
        while(k>=0 && board[k][j]==rcolor) k--
        if(k>=0 && Math.abs(k-i)>1 && board[k][j]==color){
            flag = true
            k=i-1
            while(k>=0 && board[k][j]==rcolor){
                board[k][j]=color
                k--
            }
        }
        //down
        k=i+1
        while(k<size && board[k][j]==rcolor) k++
        if(k<size && Math.abs(k-i)>1 && board[k][j]==color){
            flag = true
            k=i+1
            while(k<size && board[k][j]==rcolor){
                board[k][j]=color
                k++
            }
        }
        //left-top
        k=i-1
        l=j-1
        while(k>=0 && l>=0 && board[k][l]==rcolor){
            k--
            l--
        }
        if(k>=0 && l>=0 && Math.abs(k-i)>1 && Math.abs(l-j)>1 && board[k][l]==color){
            flag = true
            k=i-1
            l=j-1
            while(k>=0 && l>=0 && board[k][l]==rcolor){
                board[k][l]=color
                k--
                l--
            }
        }
        //left-bottom
        var k=i+1
        var l=j-1
        while(k<size && l>=0 && board[k][l]==rcolor){
            k++
            l--
        }
        if(k<size && l>=0 && Math.abs(k-i)>1 && Math.abs(l-j)>1 && board[k][l]==color){
            flag = true
            var k=i+1
            var l=j-1
            while(k<size && l>=0 && board[k][l]==rcolor){
                board[k][l]=color
                k++
                l--
            }
        }
        //right-top
        var k=i-1
        var l=j+1
        while(k>=0 && l<size && board[k][l]==rcolor){
            k--
            l++
        }
        if(k>=0 && l<size && Math.abs(k-i)>1 && Math.abs(l-j)>1 && board[k][l]==color){
            flag = true
            var k=i-1
            var l=j+1
            while(k>=0 && l<size && board[k][l]==rcolor){
                board[k][l]=color
                k--
                l++
            }
        }
        //right-bottom
        var k=i+1
        var l=j+1
        while(k<size && l<size && board[k][l]==rcolor){
            k++
            l++
        }
        if(k<size && l<size && Math.abs(k-i)>1 && Math.abs(l-j)>1 && board[k][l]==color){
            flag = true
            var k=i+1
            var l=j+1
            while(k<size && l<size && board[k][l]==rcolor){
                board[k][l]=color
                k++
                l++
            }
        }
        return flag
    }

    // Computes the winner in terms of number of pieces in the board
    winner(white, black){
        var board = this.board
        var size = board.length
        var W = 0
        var B = 0
        for( var i=0; i<size; i++)
            for(var j=0; j<size; j++)
                if(board[i][j]=='W') W++
                else if(board[i][j]=='B') B++
        var msg = ' Pieces count W:' + W + ' B:' + B
        if(W==B) return 'Draw ' + msg
        return ((W>B)?white:black) + msg
    }

    // Draw the board on the canvas
    print(){
        var board = this.board
        var size = board.length
        // Commands to be run (left as string to show them into the editor)
        var grid = []
        for(var i=0; i<size; i++){
            for(var j=0; j<size; j++)
                grid.push({"command":"translate", "y":i, "x":j, "commands":[{"command":"-"}, {"command":board[i][j]}]})
        }
        var commands = {"r":true,"x":1.0/size,"y":1.0/size,"command":"fit", "commands":grid}
        Konekti.client['canvas'].setText(commands)
    }
}

/**
 * Player class . Encapsulates all the behaviour of a hardware/software agent. (Cannot be modified or any of its attributes accesed directly)
 */
class Player{
    constructor(id, agent, color, time){
        this.id = id
        this.agent = agent
        this.color = color
        this.time = time
        this.end = this.start = -1
    }

    reduce(){ 
        this.time -= (this.end-this.start)
        this.start = this.end = -1
        return (this.time > 0) 
    }

    thinking(){ return this.start != -1 }

    compute( percept ){
        this.start = Date.now()
        var action = this.agent.compute(percept)
        this.end = Date.now()
        if(this.reduce()) return action
        return null 
    }
    
    remainingTime(end){
        return this.time + this.start - end
    }
}

/**
 * Game class. A Reversi game class (Cannot be modified or any of its attributes accesed directly)
 */
class Game{
    constructor(player1, player2, N, time){
        this.player1 = new Player(player1, players[player1], 'W', time)
        this.player2 = new Player(player2, players[player2], 'B', time)
        this.board = new Board(N)
        this.active = this.player1
        this.inactive = this.player2
        this.winner = ''
    }

    swap(){
        var t = this.active
        this.active = this.inactive
        this.inactive = t
    }

    play(){
        if(!this.board.can_play('W') && !this.board.can_play('B')){
            this.winner = this.board.winner(this.player1.id, this.player2.id)
            return this.winner
        }
        if(!this.board.can_play(this.active.color)) this.swap()
        var action = this.active.compute({'board':this.board.clone(), 'color': this.active.color, 'W':this.player1.time, 'B':this.player2.time})
        if(action!=null && 'x' in action && 'y' in action && Number.isInteger(action['x']) && Number.isInteger(action['y']) && this.board.move(action['x'], action['y'], this.active.color)){
            this.swap()
        }else{
            this.winner = this.inactive.id + ' since ' + this.active.id + ' produces a wrong move  ' 
        }
        return this.winner
    }
}

/*
* Environment (Cannot be modified or any of its attributes accesed directly)
*/
class Environment extends MainClient{
    constructor(){ super() }

    // Initializes the game
    init(){
        var white = Konekti.vc('W').value // Name of competitor with white pieces
        var black = Konekti.vc('B').value // Name of competitor with black pieces
        var time = 1000*parseInt(Konekti.vc('time').value) // Maximum playing time assigned to a competitor (milliseconds)
        var size = parseInt(Konekti.vc('size').value) // Size of the reversi board

        this.game = new Game(white, black, size, time)

        Konekti.vc('W_time').innerHTML = ''+time
        Konekti.vc('B_time').innerHTML = ''+time
    }

    // Listen to play button
    play(){
        var TIME = 50
        Konekti.vc('log').innerHTML = 'The winner is...'

        this.init()
        var game = this.game
 
        function clock(){          
            if(game.winner!='') return
            if(game.active.thinking()){
                var remaining = game.active.remainingTime(Date.now())
                Konekti.vc(game.active.color+'_time').innerHTML = remaining
                Konekti.vc(game.inactive.color+'_time').innerHTML = game.inactive.time

                if(remaining <= 0) game.winner = game.inactive.id + ' since ' + game.active.id + ' got time out'
                else setTimeout(clock,TIME)
            }else{
                Konekti.vc(game.active.color+'_time').innerHTML = game.active.time
                Konekti.vc(game.inactive.color+'_time').innerHTML = game.inactive.time
                setTimeout(clock,TIME)
            }
        }

        function print(){
            game.board.print()
            if(game.winner == '')
                setTimeout(print, 50)
        }

        function run(){
            if(game.winner =='' ){
                game.play()
                setTimeout(run,50)
            }else Konekti.vc('log').innerHTML = 'The winner is...' + game.winner
        }
        
        setTimeout(clock, 50)
        setTimeout(print,50)
        setTimeout(run,50)
    }
}

// Drawing commands
function custom_commands(){
    return [
        {
            "command":" ", "commands":[
                {
                    "command":"fillStyle",
                    "color":{"red":255, "green":255, "blue":255, "alpha":255}
                },
                {
                    "command":"polygon",
                    "x":[0.2,0.2,0.8,0.8],
                    "y":[0.2,0.8,0.8,0.2]
                }

            ]
        },
        {
            "command":"-", "commands":[
                {
                    "command":"strokeStyle",
                    "color":{"red":0, "green":0, "blue":0, "alpha":255}
                },
                {
                    "command":"polyline",
                    "x":[0,0,1,1,0],
                    "y":[0,1,1,0,0]
                }
            ]
        },
        {
            "command":"B", "commands":[
                {
                    "command":"fillStyle",
                    "color":{"red":0, "green":0, "blue":0, "alpha":255}
                },
                {
                    "command":"polygon",
                    "x":[0.2,0.2,0.8,0.8],
                    "y":[0.2,0.8,0.8,0.2]
                }
            ]
        },
        {
            "command":"W", "commands":[
                {
                    "command":"fillStyle",
                    "color":{"red":255, "green":255, "blue":0, "alpha":255}
                },
                {
                    "command":"polygon",
                    "x":[0.2,0.2,0.8,0.8],
                    "y":[0.2,0.8,0.8,0.2]
                }
            ]
        }
    ]
}