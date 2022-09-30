import jsTPS from "../common/jsTPS.js";
import Playlist from "./Playlist.js";
import AddSong_Transaction from "./transactions/AddSong_Transaction.js";
import DeleteSong_Transaction from "./transactions/DeleteSong_Transaction.js";
import EditSong_Transaction from "./transactions/EditSong_Transaction.js";
import MoveSong_Transaction from "./transactions/MoveSong_Transaction.js";

/**
 * PlaylisterModel.js
 * 
 * This class manages all playlist data for updating and accessing songs
 * as well as for loading and unloading lists. Note that editing should employ
 * an undo/redo mechanism for any editing features that change a loaded list
 * should employ transactions the jsTPS.
 * 
 * Note that we are employing a Model-View-Controller (MVC) design strategy
 * here so that when data in this class changes it is immediately reflected
 * inside the view of the page.
 * 
 * @author McKilla Gorilla
 * @author ?
 */
export default class PlaylisterModel {
    /*
        constructor

        Initializes all data for this application.
    */
    constructor() {
        // THIS WILL STORE ALL OF OUR LISTS
        this.playlists = [];

        // THIS IS THE LIST CURRENTLY BEING EDITED
        this.currentList = null;

        // THIS WILL MANAGE OUR TRANSACTIONS
        this.tps = new jsTPS();

        // WE'LL USE THIS TO ASSIGN ID NUMBERS TO EVERY LIST
        this.nextListId = 0;

        // THE MODAL IS NOT CURRENTLY OPEN
        this.confirmDialogOpen = false;
    }

    // FOR MVC STUFF
    
    setView(initView) {
        this.view = initView;
    }

    refreshToolbar() {
        this.view.updateToolbarButtons(this);
    }

    saveIndex(index){
        this.currenIndex = index;
    }

    getEditIndex(){
        return this.currenIndex;
    }

    
    // FIRST WE HAVE THE ACCESSOR (get) AND MUTATOR (set) METHODS
    // THAT GET AND SET BASIC VALUES NEEDED FOR COORDINATING INTERACTIONS
    // AND DISPLAY

    getList(index) {
        return this.playlists[index];
    }

    getListIndex(id) {
        for (let i = 0; i < this.playlists.length; i++) {
            let list = this.playlists[i];
            if (list.id === id) {
                return i;
            }
        }
        return -1;
    }

    getSongIndex(id) {
        for (let i = 0; i < this.playlists.length; i++) {
            let list = this.playlists[i];
            for(let j = 0; j < list.songs.length; j++){
                let song = list.songs[j];
                if (song.youTubeId === id) {
                    return j;
                }
            }
        }
        return -1;
    }

    getPlaylistSize() {
        return this.currentList.songs.length;
    }

    getSong(index) {
        return this.currentList.songs[index];
    }


    getDeleteListId() {
        return this.deleteListId;
    }

    setDeleteListId(initId) {
        this.deleteListId = initId;
    }

    setDeleteSongId(initId) {
        this.deleteSongId = initId;
    }

    getDeleteSongId() {
        return this.deleteSongId;
    }

    toggleConfirmDialogOpen() {
        this.confirmDialogOpen = !this.confirmDialogOpen;
        this.view.updateToolbarButtons(this);
        return this.confirmDialogOpen;
    }

    // THESE ARE THE FUNCTIONS FOR MANAGING ALL THE LISTS

    addNewList(initName, initSongs) {
        let newList = new Playlist(this.nextListId++);
        if (initName)
            newList.setName(initName);
        if (initSongs)
            newList.setSongs(initSongs);
        this.playlists.push(newList);
        this.sortLists();
        this.view.refreshLists(this.playlists);
        return newList;
    }

    addNewSong(songName,artistName,songId){
        if (this.hasCurrentList() == null){
            return;
        }
        const newSong = { title: songName,artist: artistName, youTubeId: songId }

        this.currentList.songs.push(newSong);    
        this.view.refreshPlaylist(this.currentList);
        this.modalRedoUndoButtons();
        this.saveLists();
    }

    insertSong(stack1,stack2){
        let arr = [];
        let index = stack2.pop();
        let data = stack1.pop();
        let j = 0;
        for (let i = 0 ; i <= this.currentList.songs.length;i++){
            if (i == index){
                arr[i] = data;
            } else {
            arr[i] = this.currentList.songs[j];
            j++;
            }
        }
        this.currentList.songs = arr;    
        this.view.refreshPlaylist(this.currentList);
        this.saveLists();
    }



    sortLists() {
        this.playlists.sort((listA, listB) => {
            if (listA.getName().toUpperCase() < listB.getName().toUpperCase()) {
                return -1;
            }
            else if (listA.getName().toUpperCase() === listB.getName().toUpperCase()) {
                return 0;
            }
            else {
                return 1;
            }
        });
        this.view.refreshLists(this.playlists);
    }

    hasCurrentList() {
        return this.currentList !== null;
    }

    hasSong(){
        return this.currentList.songs !== null;
    }

    unselectAll() {
        for (let i = 0; i < this.playlists.length; i++) {
            let list = this.playlists[i];
            this.view.unhighlightList(list.id); // Was : this.view.unhighlightList(i);
        }
    }


    loadList(id) {
        // If user attempts to reload the currentList, then do nothing.
        if (this.hasCurrentList() && id === this.currentList.id) {
            this.view.highlightList(id);
            return;
        }

        let list = null;
        let found = false;
        let i = 0;
        while ((i < this.playlists.length) && !found) {
            list = this.playlists[i];
            if (list.id === id) {
                // THIS IS THE LIST TO LOAD
                this.currentList = list;
                this.view.refreshPlaylist(this.currentList);
                this.view.highlightList(id); // Was : this.view.highlightList(i);
                this.modalButtons();
                this.view.updateToolbarButtonsUndoRedo();
                found = true;
            }
            i++;
        }
        this.tps.clearAllTransactions();
        this.view.updateStatusBar(this);
    }

    loadLists() {
        // CHECK TO SEE IF THERE IS DATA IN LOCAL STORAGE FOR THIS APP
        let recentLists = localStorage.getItem("recent_work");
        if (!recentLists) {
            return false;
        }
        else {
            let listsJSON = JSON.parse(recentLists);
            this.playlists = [];
            for (let i = 0; i < listsJSON.length; i++) {
                let listData = listsJSON[i];
                let songs = [];
                for (let j = 0; j < listData.songs.length; j++) {
                    songs[j] = listData.songs[j];
                }
                this.addNewList(listData.name, songs);
            }
            this.sortLists();   
            this.view.refreshLists(this.playlists);
            return true;
        }        
    }

    saveLists() {
        let playlistsString = JSON.stringify(this.playlists);
        localStorage.setItem("recent_work", playlistsString);
    }

    restoreList(){
        this.view.refreshPlaylist(this.currentList);
        this.saveLists();
    }

    unselectCurrentList() {
        if (this.hasCurrentList()) {
            this.currentList = null;
            this.view.updateStatusBar(this);
            this.view.clearWorkspace();
            this.tps.clearAllTransactions();
            this.modalButtons();
        }
    }

    renameCurrentList(initName,id) {
        if (this.hasCurrentList()) {
            let targetList = this.playlists[this.getListIndex(id)];

            if (initName === "") {
                targetList.setName("Untitled");
            } else {
                targetList.setName(initName);
            }

            this.sortLists(); 
            this.view.highlightList(id);
            this.saveLists();
            this.view.updateStatusBar(this);
        }
    }

    renameCurrentSong(songTitle,songArtist,songId,index) {
        if (this.hasCurrentList()) {
            let targetSong = this.currentList.songs[index];

            if (songTitle === "") {
                targetSong.title = "Untitled";
            } else {
                targetSong.title = songTitle;
            }

            if (songArtist === "") {
                targetSong.artist = "Unkonwn";
            } else {
                targetSong.artist = songArtist;
            }

            if (songId === "") {
                targetSong.youTubeId = "dQw4w9WgXcQ";
            } else {
                targetSong.youTubeId = songId;
            }

            this.view.refreshPlaylist(this.currentList);
            this.view.refreshLists(this.playlists);
            this.saveLists();
        }
    }


    changeBack(songTitle,songArtist,songId,index) {
        if (this.hasCurrentList()) {
            let targetSong = this.currentList.songs[index];

            targetSong.title = songTitle;
            targetSong.artist = songArtist;
            targetSong.youTubeId = songId;

            this.view.refreshPlaylist(this.currentList);
            this.view.refreshLists(this.playlists);
            this.saveLists();
        }
    }

    deleteList(id) {
        let toBeDeleted = this.playlists[this.getListIndex(id)];
        this.playlists = this.playlists.filter(list => list.id !== id);
        this.view.refreshLists(this.playlists)
        // 2 cases, deleted is current list
        // deleted is not current list
        if (toBeDeleted == this.currentList) {
            this.currentList = null;
            this.view.clearWorkspace();
            this.tps.clearAllTransactions();
            this.view.updateStatusBar(this);
        } else if (this.hasCurrentList()) {
            this.view.highlightList(this.currentList.id);
        }
        this.saveLists();
    }

    deleteSong(id) {
        let arr = [];
        let j = 0;
        for(let i = 0 ; i < this.currentList.songs.length; i++){
            if(id !== i){
                arr[j] = this.currentList.songs[i];
                j++;
            } 
        }
        this.currentList.songs = arr;
        this.view.refreshPlaylist(this.currentList);
        //this.modalCancelButtons();
        this.modalRedoUndoButtons();
        this.saveLists();
    }

    // NEXT WE HAVE THE FUNCTIONS THAT ACTUALLY UPDATE THE LOADED LIST

    moveSong(fromIndex, toIndex) {
        if (this.hasCurrentList()) {
            let tempArray = this.currentList.songs.filter((song, index) => index !== fromIndex);
            tempArray.splice(toIndex, 0, this.currentList.getSongAt(fromIndex))
            this.currentList.songs = tempArray;
            this.view.refreshPlaylist(this.currentList);
        }
        //this.modalRedoUndoButtons();
        this.saveLists();
    }

    // SIMPLE UNDO/REDO FUNCTIONS, NOTE THESE USE TRANSACTIONS

    undo() {
        if (this.tps.hasTransactionToUndo()) {
            this.tps.undoTransaction();
            this.view.updateToolbarButtons(this);
        }
    }

    redo() {
        if (this.tps.hasTransactionToRedo()) {
            this.tps.doTransaction();
            this.view.updateToolbarButtons(this);
        }
    }

    // NOW THE FUNCTIONS THAT CREATE AND ADD TRANSACTIONS
    // TO THE TRANSACTION STACK

    addMoveSongTransaction(fromIndex, onIndex) {
        let transaction = new MoveSong_Transaction(this, fromIndex, onIndex);
        this.tps.addTransaction(transaction);
        this.modalRedoUndoButtons();
        //this.view.updateToolbarButtons(this);
    }

    addSongTransaction(initSongTitle, initSongArtist, initSongYouTubeId) {
        let transaction = new AddSong_Transaction(this, initSongTitle, initSongArtist, initSongYouTubeId);
        this.tps.addTransaction(transaction);
        //this.view.updateToolbarButtons(this);
    }

    deleteSongTransaction(id) {
        let stack1 = [];
        let stack2 = [];
        let transaction = new DeleteSong_Transaction(this, stack1,stack2,id);
        this.tps.addTransaction(transaction);
    }

    editSongTransaction(songTitle, songArtist, songId) {
        let preTitle = this.getSong(this.getEditIndex()).title;
        let preArtist = this.getSong(this.getEditIndex()).artist;
        let preId = this.getSong(this.getEditIndex()).youTubeId;
        let index = this.getEditIndex();

        let transaction = new EditSong_Transaction(this,preTitle,preArtist,preId,songTitle,songArtist,songId,index);
        this.tps.addTransaction(transaction);
    }

    restore(stack){
        this.playlists = stack.pop();
        this.view.refreshLists(this.playlists);
    }

    modalButtons(){
        if (this.currentList == null){
            this.view.updateClostListButtons(this);
        } else {
            this.view.updateToolbarButtons2(this);
        }
    }

    modalCancelButtons(){
        this.view.updateToolbarButtons2(this);
    }

    modalCancelListButtons(){
        this.view.updateToolbarButtons3(this);
    }

    modalDeleteButtons(){
        this.view.updateClostListButtons(this);
    }

    modalUndoButtons(){
        if (this.tps.mostRecentTransaction == -1){
            this.view.updateToolbarButtons3(this);
        } else {
            this.view.updateToolbarButtons2(this);
        }
    }

    modalRedoButtons(){
        if (this.tps.mostRecentTransaction == this.tps.numTransactions-1){
            this.view.updateToolbarButtons4(this);
        } else {
            this.view.updateToolbarButtons2(this);
        }
    }

    modalRedoUndoButtons(){
        if (this.tps.numTransactions == 0){
            this.view.updateToolbarButtonsUndoRedo(this);
        } else {
            this.view.updateToolbarButtons4(this);
        } 
    }

    modalbuttons(){
        this.view.updateToolbarButtons(this);
    }


}