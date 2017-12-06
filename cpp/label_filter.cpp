#include <stdio.h>
#include <fstream>
#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <pcl/io/pcd_io.h>
#include <pcl/point_types.h>
#include <cmath>
using namespace std;

vector<double> ProdCameraMat(vector<double> input, vector<double>Camera_Mat){
   vector<double> result;
   double x = input[0]*Camera_Mat[0] + input[1]*Camera_Mat[1] + input[2]*Camera_Mat[2] + input[3]*Camera_Mat[3];
   double y = input[0]*Camera_Mat[4] + input[1]*Camera_Mat[5] + input[2]*Camera_Mat[6] + input[3]*Camera_Mat[7];
   double z = input[0]*Camera_Mat[8] + input[1]*Camera_Mat[9] + input[2]*Camera_Mat[10] + input[3]*Camera_Mat[11];

   result.push_back(x);
   result.push_back(y);
   result.push_back(z);
   return result;
}


vector<string> split(const string &s, char delim) {
    vector<string> elems;
    stringstream ss(s);
    string item;
    while (getline(ss, item, delim)) {
    if (!item.empty()) {
            elems.push_back(item);
        }
    }
    return elems;
}

bool bbox_TorF(pcl::PointXYZ p, double x, double y, double z , double width, double height, double depth, double yaw){
   double yaw_x = (p.x-x)*cos(M_PI/2.0-yaw)-(p.y-y)*sin(M_PI/2.0-yaw);
   double yaw_y = (p.y-y)*sin(M_PI/2.0-yaw)+(p.x-x)*cos(M_PI/2.0-yaw);
   if(abs(p.z - z) <= depth/2.0 && abs(yaw_x) <= width/2.0 && abs(yaw_y) <= height/2.0){
       return true;
   }
   return false;
}

int main(int argc, char *argv[]) {
    string calibfile_name = string(argv[1]) + string("/calibration.yml");
    ifstream ifc(calibfile_name.c_str());
    vector<double> CameraMat;
    string camera_str;
    bool category_flag = false;
    int num = 0;
    while (getline(ifc, camera_str)){
        if(camera_str!=" "){
               char delim = ':';
               vector<string> tmp_str = split(camera_str, delim);
               string category = tmp_str[0];
               size_t pos;
               while((pos = category.find_first_of(" 　\t")) != string::npos){
                   category.erase(pos, 1);
               }
               if(category_flag){
                  CameraMat.push_back(strtod(split(category,',')[0].c_str(),NULL));
                  CameraMat.push_back(strtod(split(category,',')[1].c_str(),NULL));
                  num++;
               }
               if(category == "data"){
                  category_flag = true;
                  CameraMat.push_back(strtod(split(split(tmp_str[1],'[')[1],',')[0].c_str(),NULL));
                  CameraMat.push_back(strtod(split(split(tmp_str[1],'[')[1],',')[1].c_str(),NULL));
               }

               if(num == 5){
                  CameraMat.push_back(0.0);
                  CameraMat.push_back(0.0);
                  CameraMat.push_back(0.0);
                  CameraMat.push_back(1.0);
                  break;
               }
        }
    }
    string file_name = string(argv[1]) + string("/ImageSet/Main/trainval.txt");
    ifstream ifs(file_name.c_str());
    string str;
    while (getline(ifs, str)){
        if(str!=" "){
        string annotation_file_name = string(argv[1]) + string("/Annotations/") + string(str) + string(".txt");
        ifstream ifs_frame(annotation_file_name.c_str());
        string annotations_str;

        vector<vector<string> > annotations_data;
        while (getline(ifs_frame, annotations_str)){
           if(annotations_str!=""){
               char delim = ' ';
               vector<string> split_str = split(annotations_str, delim);
               annotations_data.push_back(split_str);
           }
        }

        pcl::PointCloud<pcl::PointXYZ>::Ptr cloud (new pcl::PointCloud<pcl::PointXYZ>);
        string pcd_files = string(argv[1]) + string("/PCDPoints/") + string(str) + string("/all.pcd");
        if (pcl::io::loadPCDFile<pcl::PointXYZ> (pcd_files.c_str(), *cloud) == -1){
           PCL_ERROR ("Couldn't read pcd file \n");
           return (-1);
        }
        vector<pcl::PointCloud<pcl::PointXYZ> > clusters;
        for (size_t i = 0; i < annotations_data.size (); ++i){
            pcl::PointCloud<pcl::PointXYZ> cluster;
            clusters.push_back(cluster);
        }
        for (size_t i = 0; i < cloud->points.size (); ++i){
            for(size_t j = 0; j < annotations_data.size (); ++j){
               vector<double> position;
               position.push_back(strtod(annotations_data[j][11].c_str(),NULL));
               position.push_back(strtod(annotations_data[j][12].c_str(),NULL));
               position.push_back(strtod(annotations_data[j][13].c_str(),NULL));
               position.push_back(1.0);
               vector<double> position_cam = ProdCameraMat(position,CameraMat);
            if(bbox_TorF(cloud->points[i],
                      position_cam[0],
                      position_cam[1],
                      position_cam[2],
                      strtod(annotations_data[j][9].c_str(),NULL),
                      strtod(annotations_data[j][8].c_str(),NULL),
                      strtod(annotations_data[j][10].c_str(),NULL),
                      strtod(annotations_data[j][14].c_str(),NULL))){

                clusters[j].points.push_back(cloud->points[i]);

            }}
      }
        for(size_t i = 0; i < clusters.size (); ++i){
           cout << clusters[i].points.size() << ",";
        }
        cout << "\n";

        string  output_file_name =  string("pcd_data.pcd");
        clusters[0].width = 1;
        clusters[0].height = clusters[0].points.size ();
        pcl::io::savePCDFileASCII (output_file_name.c_str() , clusters[0]);
    }
    }

    pcl::PointCloud<pcl::PointXYZ>::Ptr cloud (new pcl::PointCloud<pcl::PointXYZ>);
    string pcd_files = string(argv[1]) + string("/PCDPoints/000001/000001.pcd");
    if (pcl::io::loadPCDFile<pcl::PointXYZ> (pcd_files.c_str(), *cloud) == -1){
       PCL_ERROR ("Couldn't read pcd file \n");
       return (-1);
    }
    cout << cloud->points.size();
    return 0;
}
