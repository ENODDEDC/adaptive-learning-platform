import { NextResponse } from 'next/server';
import connectMongo from '@/config/mongoConfig';
import { Form } from '@/models/Form';
import { verifyToken } from '@/utils/auth';

export async function GET(request, { params }) {
  try {
    await connectMongo();
    const { id } = params;

    const form = await Form.findById(id)
      .populate('createdBy', 'name email')
      .lean();

    if (!form) {
      return NextResponse.json({ message: 'Form not found' }, { status: 404 });
    }

    return NextResponse.json({ form }, { status: 200 });
  } catch (error) {
    console.error('Error fetching form:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    const { id } = params;

    const form = await Form.findById(id);
    if (!form) {
      return NextResponse.json({ message: 'Form not found' }, { status: 404 });
    }

    await Form.findByIdAndDelete(id);

    return NextResponse.json({
      message: 'Form deleted successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting form:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const payload = await verifyToken();
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    const { id } = params;
    const { title, description, questions } = await request.json();

    const form = await Form.findById(id);
    if (!form) {
      return NextResponse.json({ message: 'Form not found' }, { status: 404 });
    }

    const updatedForm = await Form.findByIdAndUpdate(
      id,
      { title, description, questions },
      { new: true }
    ).populate('createdBy', 'name email');

    return NextResponse.json({
      message: 'Form updated successfully',
      form: updatedForm
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating form:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}