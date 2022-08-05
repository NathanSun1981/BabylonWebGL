/////////////////////////////////////////////////////////////////
//
// Bing WebGL using Babylon JS 
//
// demo by Andy Beaulieu - http://www.andybeaulieu.com
//
// see www.babylonjs.com for more info on Babylon JS
//
// LICENSE: This code is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
// without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. ANY 
// EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF 
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE REGENTS
// OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; 
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF 
// LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) 
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
/////////////////////////////////////////////////////////////////
$(document).ready(function () {
    var canvas = $("#canvas")[0];
    var controlPanel = $("#controlPanel")[0];
    var _routeChanged = false;
    var _tileEngine;

    // Check support
    if (!BABYLON.Engine.isSupported()) {
        document.getElementById("notSupported").className = "";
        document.getElementById("opacityMask").className = "";
    } else {

        // Babylon
        var engine = new BABYLON.Engine(canvas, true);

        _tileEngine = new BINGWEBGL.Engine(engine);

        // Creating scene
        scene = _tileEngine.createScene(engine);

        if (location.hostname == "localhost") {
            scene.activeCamera.attachControl(canvas);
        }

        // Once the scene is loaded, just register a render loop to render it
        engine.runRenderLoop(function () {
            scene.render();
        });

        // Resize
        window.addEventListener("resize", function () {
            engine.resize();
        });

        // get the default directions from dropdown
        $("#hostname").val(location.hostname);

        var directions = $("#ddlRecommended").val();
        getDirectionsFromDropdown();
        _tileEngine.getDirections(directions, _tileEngine._levelOfDetail);

    }

   
    function getCamera() {
        $("#cameraPosition").val(_tileEngine._camera.position);
        if (location.hostname == "localhost") {
            $.ajax({
                type: "POST",
                url: "http://10.0.75.1:8080/BabylonMapUpdate.php?action=update",
                //data: "Longitude=" + $("#txtFrom").val().split(",")[0] + "&" + "Latitude=" + $("#txtFrom").val().split(",")[1] + "&" + "positionX=" + _tileEngine._camera.position.x + "&" + "positionY=" + _tileEngine._camera.position.y + "&" + "positionZ=" + _tileEngine._camera.position.z + "&" + "rotationX=" + _tileEngine._camera.rotation.x + "&" + "rotationY=" + _tileEngine._camera.rotation.y + "&" + "rotationZ=" + _tileEngine._camera.rotation.z,               
                data: {
                    operator: location.hostname.toString(),
                    Longitude: $("#txtFrom").val().split(",")[0].toString(),
                    Latitude: $("#txtFrom").val().split(",")[1].toString(),
                    positionX: _tileEngine._camera.position.x.toString(),
                    positionY: _tileEngine._camera.position.y.toString(),
                    positionZ: _tileEngine._camera.position.z.toString(),
                    rotationX: _tileEngine._camera.rotation.x.toString(),
                    rotationY: _tileEngine._camera.rotation.y.toString(),
                    rotationZ: _tileEngine._camera.rotation.z.toString(),
                },
                
                xhrFields: {
                    withCredentials: false
                },
                            

            });
        }

    }

    document.onpointermove = getCamera; //鼠标点击触发

    if (location.hostname != "localhost") {
        $(function () {
            setInterval(function () {
                //sychronize the map
                $.ajax({
                    type: "POST",
                    url: "http://10.0.75.1:8080/BabylonMapUpdate.php?action=get",
                    data: {
                        operator: "localhost",
                    },
                    xhrFields: {
                        withCredentials: false
                    },
                    error: function (xhr, status, error) {
                        var err = eval("(" + xhr.responseText + ")");
                        $("#receivedData").val(err);
                    },

                    success: function (result) {
                        console.log("******************************" + result.toString());
                        $("#receivedData").val(result.toString());

                        if (result.length > 10) {
                            _tileEngine._camera.setPosition(new BABYLON.Vector3(result.split('\t')[2], result.split('\t')[3], result.split('\t')[4]));
                            _tileEngine._camera.rotation = new BABYLON.Vector3(result.split('\t')[5], result.split('\t')[6], result.split('\t')[7]);

                        }
 

                    },


                });

            }, 1);
        })
    }

    
    // UI
    var panelIsClosed = true;
    $("#btnOptions").on("click", function () {
        if (panelIsClosed) {
            panelIsClosed = false;
            controlPanel.style.webkitTransform = "translateY(0px)";
            controlPanel.style.transform = "translateY(0px)";
        } else {
            panelIsClosed = true;
            controlPanel.style.webkitTransform = "translateY(300px)";
            controlPanel.style.transform = "translateY(300px)";
        }
    });

    /*

    $("#btnPlay").on("click", function () {
        pauseRoutePlayback(true);
    });


    $("#btnPause").on("click", function () {
        pauseRoutePlayback(true);
    });
    */

    $("#btnFastForward").on("click", function () {
        _tileEngine._vehicleSpeed++;

        if (_tileEngine._vehicleSpeed > 4)
            _tileEngine._vehicleSpeed = 1;

        $("#divPlaybackSpeed").html(_tileEngine._vehicleSpeed + "x");
    });

    $("#lnkGoThere1").on("click", goThere);
    //$("#lnkGoThere2").on("click", goThere);

    function goThere() {
        if (location.hostname == "localhost") {
            var from = ($("#txtFrom").val());
            var to = ($("#txtFrom").val());
            var directions = directionsToQuery(from, to);
            _tileEngine.getDirections(directions, _tileEngine._levelOfDetail);
            _tileEngine._vehicleSpeed = 1;
            $("#divPlaybackSpeed").html(_tileEngine._vehicleSpeed + "x");
            pauseRoutePlayback();
        }   
    }

    $("#ddlRecommended").on("change", function () {
        getDirectionsFromDropdown();
    });

    function getDirectionsFromDropdown() {
        var directions = $("#ddlRecommended").val();
        var query = directionsFromQuery(directions);
        $("#txtFrom").val(unescape(query.from));
        //$("#txtTo").val(unescape(query.to));
    }


    function pauseRoutePlayback() {
        _tileEngine._playbackRoutePath = false;
        /*
        if (pauseIt) {
            _tileEngine._playbackRoutePath = false;
            $("#btnPlay").show();
            $("#btnPause").hide();
        } else {
            _tileEngine._playbackRoutePath = false;
            $("#btnPause").show();
            $("#btnPlay").hide();
        }
        */
    }

});