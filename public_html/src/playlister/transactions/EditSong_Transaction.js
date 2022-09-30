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
export default class EditSong_Transaction extends jsTPS_Transaction {
    constructor(initModel,preTitle,preArtist,preSongId,newTitle,newArtist,newSongId,index) {
        super();
        this.model = initModel;
        this.preTitle = preTitle;
        this.preArtist = preArtist;
        this.preSongId = preSongId;
        this.newTitle = newTitle;
        this.newArtist = newArtist;
        this.newSongId = newSongId;
        this.index = index;
    }
    
    doTransaction() {
        this.model.renameCurrentSong(this.newTitle,this.newArtist,this.newSongId,this.index);
    }

    undoTransaction() {
        this.model.changeBack(this.preTitle,this.preArtist,this.preSongId,this.index);
    }
}