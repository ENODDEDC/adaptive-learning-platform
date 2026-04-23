import connectMongo from '@/config/mongoConfig';
import { Form } from '@/models/Form';
import { verifyToken } from '@/utils/auth';
import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    const { id, studentId } = await params;

    const form = await Form.findById(id);
    if (!form) {
      return NextResponse.json({ message: 'Form not found' }, { status: 404 });
    }

    const responseIndex = form.responses.findIndex(
      r => r.studentId.toString() === studentId
    );

    if (responseIndex === -1) {
      return NextResponse.json({ message: 'Response not found' }, { status: 404 });
    }

    form.responses.splice(responseIndex, 1);
    await form.save();

    return NextResponse.json({ message: 'Response deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete form response error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
