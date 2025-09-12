import connectMongoDB from '@/config/mongoConfig';
import Cluster from '@/models/Cluster';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';

export async function POST(request) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = payload.userId;

    await connectMongoDB();
    const { action, clusterIds } = await request.json();

    if (!action || !clusterIds || !Array.isArray(clusterIds) || clusterIds.length === 0) {
      return NextResponse.json({ message: 'Invalid request data' }, { status: 400 });
    }

    // Verify user owns these clusters
    const clusters = await Cluster.find({
      _id: { $in: clusterIds },
      createdBy: userId
    });

    if (clusters.length !== clusterIds.length) {
      return NextResponse.json({ message: 'Some clusters not found or not owned by user' }, { status: 403 });
    }

    let result;
    switch (action) {
      case 'archive':
        result = await Cluster.updateMany(
          { _id: { $in: clusterIds } },
          { $set: { archived: true, archivedAt: new Date() } }
        );
        break;
      
      case 'unarchive':
        result = await Cluster.updateMany(
          { _id: { $in: clusterIds } },
          { $unset: { archived: 1, archivedAt: 1 } }
        );
        break;
      
      case 'delete':
        result = await Cluster.deleteMany({ _id: { $in: clusterIds } });
        break;
      
      case 'duplicate':
        const duplicatedClusters = [];
        for (const cluster of clusters) {
          const duplicatedCluster = new Cluster({
            name: `${cluster.name} (Copy)`,
            section: cluster.section,
            classCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
            courses: cluster.courses,
            createdBy: userId,
            enrolledUsers: [userId], // Only include the creator
            coverColor: cluster.coverColor,
            description: cluster.description,
            isPublic: false, // Duplicated clusters are private by default
            allowJoin: cluster.allowJoin
          });
          await duplicatedCluster.save();
          duplicatedClusters.push(duplicatedCluster);
        }
        result = { duplicatedClusters };
        break;
      
      default:
        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ 
      message: `Successfully ${action}d ${clusterIds.length} cluster(s)`,
      result 
    }, { status: 200 });

  } catch (error) {
    console.error('Bulk operation error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
