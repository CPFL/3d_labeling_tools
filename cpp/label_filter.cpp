#include <stdio.h>
#include <fstream>
#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <pcl/io/pcd_io.h>
#include <pcl/point_types.h>
#include <cmath>
#include <iomanip>
#include <glob.h>
#include <opencv2/opencv.hpp>
#include <opencv2/highgui/highgui.hpp>

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

bool bbox_TorF(pcl::PointXYZI p, double x, double y, double z , double height, double width, double depth, double yaw){
   double yaw_x = (p.x-x)*cos(yaw/2.0)-(p.y-y)*sin(yaw/2.0);
   double yaw_y = (p.y-y)*sin(yaw/2.0)+(p.x-x)*cos(yaw/2.0);
   if((abs(p.z - z)*2.0 - 0.05 <= depth) && (abs(yaw_x)*2.0 - 0.05<= height) && (abs(yaw_y)*2.0 - 0.05<= width)){
       return true;
   }
   return false;
}

string calcurate_alpha(pcl::PointCloud<pcl::PointXYZI> cluster,cv::Mat cameraExtrinsicMat){
        pcl::PointXYZ centroid;
        for (size_t i = 0; i < cluster.points.size (); ++i)
        {
            pcl::PointXYZI p;
            p.x = cluster.points[i].x;
            p.y = cluster.points[i].y;
            p.z = cluster.points[i].z;
            p.intensity = cluster.points[i].intensity;

            centroid.x += p.x;
            centroid.y += p.y;
            centroid.z += p.z;
        }

        centroid.x /= cluster.points.size ();
        centroid.y /= cluster.points.size ();
        centroid.z /= cluster.points.size ();

        cv::Mat point(1,3,CV_64F);
        point.at<double>(0)=double(centroid.x);
        point.at<double>(1)=double(centroid.y);
        point.at<double>(2)=double(centroid.z);
        cv::Mat invR=cameraExtrinsicMat(cv::Rect(0,0,3,3)).t();
        cv::Mat invT=-invR*(cameraExtrinsicMat(cv::Rect(3,0,1,3)));
        point=point*invR.t()+invT.t();

        double x = point.at<double>(0);
        double z = point.at<double>(2);

        double alpha = acos(x/pow(x*x+z*z,0.5));
        stringstream ss;
        ss << alpha;
        return ss.str();
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
    cv::Mat cameraextrinsicmat;
    cv::FileStorage fs(calibfile_name,cv::FileStorage::READ);
    if(!fs.isOpened())
    {
       std::cout<<"Invalid calibration filename.";
    }

    fs["CameraExtrinsicMat"]>>cameraextrinsicmat;
    
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

        glob_t globbuf;
        int i;
        string semi_pcd_files = string(argv[1]) + string("/PCDPoints/") + string(str) + string("/??????.pcd");

        int ret = glob(semi_pcd_files.c_str(), 0, NULL, &globbuf);
        for (i = 0; i < globbuf.gl_pathc; i++) {
           remove(globbuf.gl_pathv[i]);
        }
        globfree(&globbuf);

        pcl::PointCloud<pcl::PointXYZI>::Ptr cloud (new pcl::PointCloud<pcl::PointXYZI>);
        string pcd_files = string(argv[1]) + string("/PCDPoints/") + string(str) + string("/all.pcd");
        if (pcl::io::loadPCDFile<pcl::PointXYZI> (pcd_files.c_str(), *cloud) == -1){
           PCL_ERROR ("Couldn't read pcd file \n");
           return (-1);
        }
        vector<pcl::PointCloud<pcl::PointXYZI> > clusters;
        for (size_t i = 0; i < annotations_data.size (); ++i){
            pcl::PointCloud<pcl::PointXYZI> cluster;
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
                      strtod(annotations_data[j][8].c_str(),NULL),
                      strtod(annotations_data[j][9].c_str(),NULL),
                      strtod(annotations_data[j][10].c_str(),NULL),
                      strtod(annotations_data[j][14].c_str(),NULL))){

                clusters[j].points.push_back(cloud->points[i]);

            }}
      }

        remove(annotation_file_name.c_str());
        ofstream outputfile(annotation_file_name.c_str());

        int result_num = 0;
        for(size_t i = 0; i < clusters.size (); ++i){
           if(clusters[i].points.size ()!=0){
           ostringstream oss;
           oss << setfill('0') << right << setw(6) << result_num;
           string  output_file_name =  string(argv[1]) + string("/PCDPoints/") + string(str) + string("/") + oss.str() + string(".pcd");
           clusters[i].width = 1;
           clusters[i].height = clusters[i].points.size ();
           pcl::io::savePCDFileASCII (output_file_name.c_str() , clusters[i]);
           string alpha = calcurate_alpha(clusters[i],cameraextrinsicmat);
           outputfile << annotations_data[i][0] << " " << annotations_data[i][1] << " " << annotations_data[i][2] << " " << alpha << " " << annotations_data[i][4] << " " << annotations_data[i][5] << " " << annotations_data[i][6] << " " << annotations_data[i][7] << " " << annotations_data[i][8] << " " << annotations_data[i][9] << " " << annotations_data[i][10] << " " << annotations_data[i][11] << " " << annotations_data[i][12] << " " << annotations_data[i][13] << " " << annotations_data[i][14] << " " << annotations_data[i][15] <<"\n";
           
           result_num++;
        }}
        outputfile.close();
    }
    }
    return 0;
}
