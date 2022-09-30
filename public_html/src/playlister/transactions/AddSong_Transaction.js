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
export default class AddSong_Transaction extends jsTPS_Transaction {
    constructor(initModel, initTitle, initArtist, initSongYouTubeId) {
        super();
        this.model = initModel;
        this.songTitle = initTitle;
        this.songArtist = initArtist;
        this.songId = initSongYouTubeId;
    }

    doTransaction() {
        this.model.addNewSong(this.songTitle, this.songArtist, this.songId);
    }
    
    undoTransaction() {
        this.model.deleteSong(this.model.getPlaylistSize()-1);
    }
}