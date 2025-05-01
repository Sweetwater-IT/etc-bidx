import { Modal, TextInput, Button, Stack, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { CustomerFormData } from '@/app/customers/types';

interface CreateContactModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: CustomerFormData) => void;
}

export function CreateContactModal({ opened, onClose, onSubmit }: CreateContactModalProps) {
  const form = useForm({
    initialValues: {
      name: '',
      email: '',
      phone: '',
    },
  });

  return (
    <Modal opened={opened} onClose={onClose} title="Create Contact">
      <form onSubmit={form.onSubmit(onSubmit)}>
        <Stack>
          <TextInput
            label="Name"
            {...form.getInputProps('name')}
          />
          <TextInput
            label="Email"
            {...form.getInputProps('email')}
          />
          <TextInput
            label="Phone"
            {...form.getInputProps('phone')}
          />
          <Group justify="flex-end">
            <Button type="submit">Create</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
} 