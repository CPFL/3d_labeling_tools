#include <stdio.h>
#include <fstream>
#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <pcl/io/pcd_io.h>
#include <pcl/point_types.h>
using namespace std;

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

int main(int argc, char *argv[]) {
    string file_name = string(argv[1]) + string("/ImageSet/Main/trainval.txt");
    ifstream ifs(file_name.c_str());
    string str;
    while (getline(ifs, str)){
        if(str!=""){
        string annotation_file_name = string(argv[1]) + string("/Annotations/") + string(str) + string(".txt");
        ifstream ifs_frame(annotation_file_name.c_str());
        string annotations_str;
        pcl::PointCloud<pcl::PointXYZ>::Ptr cloud (new pcl::PointCloud<pcl::PointXYZ>);
        string pcd_files = string(argv[1]) + string("/PCDPoints/") + string(str) + string("/all.pcd");
        if (pcl::io::loadPCDFile<pcl::PointXYZ> (pcd_files.c_str(), *cloud) == -1){
           PCL_ERROR ("Couldn't read pcd file \n");
           return (-1);
        }
        while (getline(ifs_frame, annotations_str)){
           if(annotations_str!=""){
               char delim = " ";
               vector<string> split_str = split(annotations_str, delim);
                  cout << split_str[0] << "\n";
           }
        }
        for (size_t i = 0; i < cloud->points.size (); ++i)
            std::cout << "    " << cloud->points[i].x
              << " "    << cloud->points[i].y
              << " "    << cloud->points[i].z << std::endl;
      }
    }
    return 0;
}
