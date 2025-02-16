$(function () {

    window.viewer = new Potree.Viewer(document.getElementById("potree_render_area"));

    // viewer.setBackground("black");

    viewer.setEDLEnabled(false);
    viewer.setFOV(80);
    viewer.setPointBudget(1_000_000);
    viewer.loadSettingsFromURL();

    viewer.setRightView();

    viewer.setEDLEnabled(true);
    // viewer.setEDLRadius(1.4);
    // viewer.setEDLStrength(1.2);
    // viewer.setBackground("skybox");

    viewer.setDescription("Hrvatski šumarski institut: 7_1cm_laz.laz");

    viewer.loadGUI(() => {
        viewer.setLanguage('hr');
        $("#menu_tools").next().show();
        $("#menu_clipping").next().show();
        //viewer.toggleSidebar();

        // Sakrij jezični izbornik
        $("#sidebar_header").hide();
    });

    // Load and add point cloud to scene
    Potree.loadPointCloud("7_1/metadata.json", "7_1", e => {
        let scene = viewer.scene;
        let pointcloud = e.pointcloud;

        let material = pointcloud.material;
        material.size = 0.6;
        material.minSize = 0.4;
        material.pointSizeType = Potree.PointSizeType.FIXED;
        material.shape = Potree.PointShape.SQUARE;

        scene.addPointCloud(pointcloud);

        viewer.fitToScreen();

        // // // Set specific camera position and target
        // viewer.scene.view.position.set(
        //     460713.363, 5051277.927, 13.890
        // );
        // viewer.scene.view.lookAt(
        //     460689.741, 5051266.563, 14.257
        // );
    });
});
