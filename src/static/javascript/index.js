(function(){

let wavesurfers;
function waveCreator(container,colors){
  //wrapper for wavesurfer creator
  waves = WaveSurfer.create({
    container: container,
    waveColor: colors[0],
    progressColor: colors[1],
    hideScrollbar:true
 });
 return waves
}

document.getElementById('submit').addEventListener('click',function(event){

    //prevent from scrolling to top of page
    event.preventDefault();

    //alowed file types
    const fileTypes=["mp3","wav","m4a","flac"]

    //get file and/or url from document
    const file=document.getElementById("file");
    const url=document.getElementById("url").value;

    //create form for request
    let form= new FormData();

    let reqUrl;
    if (file.files.length>0){

       //verify file type
       if( fileTypes.indexOf(file.files[0].name.slice(-3).toLowerCase())===-1){
           alert("improper file type. currently supported file types are mp3, WAV, FLAC, m4a");
           return;
       }
        //add file to form if file is present
        form.append('file',file.files[0])
        reqUrl='/process'


    }
    else if (url.length>5){
        //get id from url
        const id= url.split('=')[1]

         //validate the proper length of id
        if (id.length!==11){
            alert("Invalid url")
            return
        }
        // add id and url to form
        form.append('id',id);
        form.append('url',url);
        reqUrl='/download'
    }
    else{
        alert("no track uploaded or url selected");
        return;
    }

    //possible dropdown menu values
    const effectArray=["SLOWED + REVERB","BASS BOOST", "DISTORTED","SPED UP"]
    const intensityArray=["NONE","LOW","MEDIUM","HIGH"]


    let name=''
    const type=document.getElementById("dropdownValue").innerText;
    const intensity=document.getElementById("dropdownIValue").innerText;



    //make sure drop down menus or populated
    if (type==="SELECT EFFECT"||intensity==="SELECT LEVEL"){
        alert("Effect and level must be selected");
        return;
    }

    //view loader
    $("#submit").hide();
    $("#loader").show();

    if (file.files.length>0){
        name=`${file.files[0].name.slice(0,-4)} ${type}.mp3`;
    }



    //convert dropdown menu options to integers
    form.append('type',effectArray.indexOf(type))
    form.append('intensity',intensityArray.indexOf(intensity))

    //request to server
    axios({
      method: 'post',
      url: reqUrl,
      data:form,
      headers:{'Content-Type': 'multipart/form-data' },
      responseType: 'blob',

    })
      .then((res) => {
         if (reqUrl==='/download'){
             //set file name
             name= `${res.headers.name} ${type}.mp3`
         }

         //create waveform for returned song
         song = new Blob([res.data], { 'type' : 'audio/mp3' });
         let wavesurfers=waveCreator('#waveforms',['violet','purple']);
         wavesurfers.loadBlob(song);



         const fileDownloadButton=document.getElementById("download")
         function download(){

         // create download link and connect it to download button click

            const anchor = document.createElement("a");
            anchor.download = name;
            anchor.href = window.URL.createObjectURL(song);
            anchor.target ="_blank";
            anchor.style.display = "none"; // just to be safe!
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
         }



         fileDownloadButton.addEventListener('click',download);
         document.getElementById('play').addEventListener('click', function(input,event) {
             //play and pause song on button click
             wavesurfers.playPause();

         });

                //switch to track view from homepage
                $("#loader").hide();
                $("#submit").show();
                $("#home").hide();
                $("#songTitle").text(name);
                $("#track").show();



    })
    .catch((err)=>{
        alert(err);
        $("#loader").hide();
        $("#submit").show();
        return;
    }



);







});
document.getElementById('file').addEventListener('change', function(input,event) {
    // add file title to file button
     $("#selectFile").text(input.target.files[0].name);




});



const $drowdownArrow = document.querySelector('.fa-angle-down');
const $checkbox = document.getElementById('openDropdown');
const $icheckbox = document.getElementById('i-openDropdown');
const $idropdownMenu = document.querySelector('.i-dropdown-menu');
const $dropdownMenu = document.querySelector('.dropdown-menu');

function handleDropdown(menu,checkbox){
    menu.addEventListener('click', (e) => {
      checkbox.checked = false;
      // setting checked to false won't trigger 'change'
      // event, manually dispatch an event to rotate
      // dropdown arrow icon
      checkbox.dispatchEvent(new Event('change'));
    });
}
handleDropdown($dropdownMenu,$checkbox);
handleDropdown($idropdownMenu,$icheckbox);

function dropdownUpdate(dropdown, value){
    const possibleValues= document.querySelectorAll(dropdown);
    possibleValues.forEach((item, i) => {
        item.addEventListener('click',function(){
            //update dropdown menu text when an option is selected
            document.getElementById(value).innerHTML=item.innerText+'<i class="fa fa-arrow-down" style="color:#121212;font-size:25px"></i>'


        });
    });
}
dropdownUpdate('.effectValue','dropdownValue');
dropdownUpdate('.intensityValue','dropdownIValue')
/*
const effectValues= document.querySelectorAll(".effectValue");
effectValues.forEach((item, i) => {
    item.addEventListener('click',function(){
        //update dropdown menu text when an option is selected
        document.getElementById("dropdownValue").innerHTML=item.innerText+'<i class="fa fa-arrow-down" style="color:#121212;font-size:25px"></i>'


    });
});
const intensityValues= document.querySelectorAll(".intensityValue");
intensityValues.forEach((item, i) => {
    item.addEventListener('click',function(){
        //update dropdown menu text when an option is selected
        document.getElementById("dropdownIValue").innerHTML=item.innerText+'<i class="fa fa-arrow-down" style="color:#121212;font-size:25px;"></i>'

});
});*/
}());
