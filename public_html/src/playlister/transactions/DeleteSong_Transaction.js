import jsTPS_Transaction from "../../common/jsTPS.js"
/**
 * MoveSong_Transaction
 * 
 * This class represents a transaction that works with drag
 * and drop. It will be managed by the transaction stack.
 * 
 * @author McKilla Gorilla
 * @author ?
 */
export default class DeleteSong_Transaction extends jsTPS_Transaction {
    constructor(initModel, stack1,stack2,index) {
        super();
        this.model = initModel;
        this.stack1 = stack1;
        this.stack2 = stack2;
        this.index = index;
    }
    
    doTransaction() {
        let copySong = this.model.getSong(this.index);
        this.stack1.push(copySong);
        this.stack2.push(this.index);
        this.model.deleteSong(this.index);
    }

    undoTransaction() {
        this.model.insertSong(this.stack1,this.stack2);
    }
}